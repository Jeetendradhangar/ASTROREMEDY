import json
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import transaction

from orders.models import Product
from .models import Consultation, VoiceNote, VoiceReply, RecommendedRemedy
from .serializers import ConsultationSerializer
from .permissions import IsOwner, IsAstrologer

logger = logging.getLogger(__name__)

def upload_audio_helper(file_obj, folder):
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', 'dummy')
    
    # Ensure the file pointer is reset to the beginning
    try:
        file_obj.seek(0)
    except Exception as e:
        logger.warning(f"Could not seek(0) on uploaded file: {str(e)}")

    if cloud_name == 'dummy' or not cloud_name:
        # Fallback to local Django storage
        filename = default_storage.save(f'{folder}/{file_obj.name}', file_obj)
        # Return absolute URL path pointing to Django backend
        backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')
        return f"{backend_url}{settings.MEDIA_URL}{filename}"
    else:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            # Upload using "video" resource type for proper audio format/streaming support
            upload_result = cloudinary.uploader.upload(file_obj, resource_type="video")
            return upload_result.get('secure_url')
        except Exception as e:
            logger.error(f"Cloudinary upload failed, falling back to local storage: {str(e)}")
            try:
                file_obj.seek(0)
            except Exception:
                pass
            filename = default_storage.save(f'{folder}/{file_obj.name}', file_obj)
            backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')
            return f"{backend_url}{settings.MEDIA_URL}{filename}"


from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ConsultationViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_astrologer or user.is_staff:
            # Astrologers/Admins see all paid/in_review/replied/closed consultations
            return Consultation.objects.exclude(status='pending')
        # Regular users see only their own consultations
        return Consultation.objects.filter(user=user)

    @transaction.atomic
    def perform_create(self, serializer):
        from django.db.models import Max
        from users.models import CustomUser
        
        # Lock the user record to prevent race conditions during inquiry index allocation
        user = CustomUser.objects.select_for_update().get(id=self.request.user.id)
        
        latest = Consultation.objects.filter(user=user).aggregate(Max('inquiry_number'))
        next_number = (latest['inquiry_number__max'] or 0) + 1
        
        serializer.save(user=user, inquiry_number=next_number, status='pending')


class UploadVoiceNoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        consultation = get_object_or_404(Consultation, id=id)
        if consultation.user != request.user and not (request.user.is_astrologer or request.user.is_staff):
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('voice_note')
        if not file_obj:
            return Response({"error": "No file uploaded under key 'voice_note'"}, status=status.HTTP_400_BAD_REQUEST)

        import uuid
        temp_name = f"temp_voicenotes/{uuid.uuid4()}_{file_obj.name}"
        temp_file_path = default_storage.save(temp_name, file_obj)

        from .tasks import upload_audio_task
        task = upload_audio_task.delay(consultation.id, temp_file_path, 'note')

        return Response({
            "message": "Voice note upload queued.",
            "task_id": task.id,
            "status": "processing"
        }, status=status.HTTP_202_ACCEPTED)


class GetVoiceReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        consultation = get_object_or_404(Consultation, id=id)
        if consultation.user != request.user and not (request.user.is_astrologer or request.user.is_staff):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        voice_reply = consultation.voice_replies.order_by('-created_at').first()
        if voice_reply:
            return Response({
                "file_url": voice_reply.file_url,
                "duration": voice_reply.duration,
                "created_at": voice_reply.created_at
              }, status=status.HTTP_200_OK)
        return Response({"error": "Voice reply not found"}, status=status.HTTP_404_NOT_FOUND)


class UpdateStatusView(APIView):
    permission_classes = [IsAstrologer]

    def patch(self, request, id):
        consultation = get_object_or_404(Consultation, id=id)
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Consultation.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Must be one of {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)

        consultation.status = new_status
        consultation.save()
        return Response({
            "id": consultation.id,
            "status": consultation.status
        }, status=status.HTTP_200_OK)


class UploadVoiceReplyView(APIView):
    permission_classes = [IsAstrologer]

    def post(self, request, id):
        consultation = get_object_or_404(Consultation, id=id)
        file_obj = request.FILES.get('voice_reply')
        if not file_obj:
            return Response({"error": "No file uploaded under key 'voice_reply'"}, status=status.HTTP_400_BAD_REQUEST)

        product_ids_str = request.data.get('product_ids', '[]')
        instructions = request.data.get('instructions', '')

        try:
            product_ids = json.loads(product_ids_str)
        except json.JSONDecodeError:
            return Response({"error": "product_ids must be a valid JSON array string"}, status=status.HTTP_400_BAD_REQUEST)

        import uuid
        temp_name = f"temp_voicereplies/{uuid.uuid4()}_{file_obj.name}"
        temp_file_path = default_storage.save(temp_name, file_obj)

        from .tasks import upload_audio_task
        task = upload_audio_task.delay(
            consultation.id, 
            temp_file_path, 
            'reply', 
            {
                'product_ids': product_ids,
                'instructions': instructions,
                'astrologer_id': request.user.id
            }
        )

        return Response({
            "message": "Voice reply upload queued.",
            "task_id": task.id,
            "status": "processing"
        }, status=status.HTTP_202_ACCEPTED)

