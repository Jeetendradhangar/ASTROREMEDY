from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer
from consultations.permissions import IsAstrologer

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        user = self.request.user
        # Safe attribute access check in case of custom/anonymous user objects
        is_admin_or_astrologer = user.is_authenticated and (
            getattr(user, 'is_astrologer', False) or getattr(user, 'is_staff', False)
        )
        if is_admin_or_astrologer:
            return Review.objects.all().order_by('-created_at')
        return Review.objects.filter(is_approved=True).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to list reviews (database might not be migrated): {str(e)}")
            return Response([])

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAstrologer()]
        elif self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        user = self.request.user
        is_approved = False

        is_admin_or_astrologer = user.is_authenticated and (
            getattr(user, 'is_astrologer', False) or getattr(user, 'is_staff', False)
        )
        if is_admin_or_astrologer:
            consultation = serializer.validated_data.get('consultation')
            if consultation:
                user = consultation.user
            is_approved = self.request.data.get('is_approved', False)

        serializer.save(user=user, is_approved=is_approved)


