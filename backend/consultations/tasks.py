import os
import json
import logging
from celery import shared_task
from django.core.files.storage import default_storage
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def upload_audio_task(consultation_id, temp_file_path, upload_type, extra_data=None):
    from consultations.models import Consultation, VoiceNote, VoiceReply, RecommendedRemedy
    from orders.models import Product
    from consultations.views import upload_audio_helper

    extra_data = extra_data or {}
    try:
        # 1. Retrieve the consultation
        consultation = Consultation.objects.get(id=consultation_id)

        # 2. Check if temp file exists
        if not default_storage.exists(temp_file_path):
            logger.error(f"Temporary file {temp_file_path} not found")
            return {"success": False, "error": "Temporary file not found"}

        # 3. Perform audio upload to Cloudinary/Django media storage via helper
        with default_storage.open(temp_file_path, 'rb') as file_obj:
            file_obj.name = os.path.basename(temp_file_path)
            folder = 'voicenotes' if upload_type == 'note' else 'voicereplies'
            file_url = upload_audio_helper(file_obj, folder)

        # 4. Save to database using transaction
        with transaction.atomic():
            if upload_type == 'note':
                VoiceNote.objects.create(
                    consultation=consultation,
                    file_url=file_url
                )
            else:
                # Astrologer reply
                astrologer_id = extra_data.get('astrologer_id')
                astrologer = User.objects.get(id=astrologer_id)
                
                VoiceReply.objects.create(
                    consultation=consultation,
                    file_url=file_url,
                    astrologer=astrologer
                )

                # Process remedy recommendations
                product_ids = extra_data.get('product_ids', [])
                instructions = extra_data.get('instructions', '')

                RecommendedRemedy.objects.filter(consultation=consultation).delete()
                for p_id in product_ids:
                    try:
                        product = Product.objects.get(id=p_id)
                        RecommendedRemedy.objects.create(
                            consultation=consultation,
                            product=product,
                            instructions=instructions
                        )
                    except Product.DoesNotExist:
                        logger.warning(f"Product ID {p_id} recommended by astrologer does not exist")

                # Set status to replied
                consultation.status = 'replied'
                consultation.save()

        # 5. Cleanup temporary storage file
        default_storage.delete(temp_file_path)
        logger.info(f"Successfully processed background audio upload for consultation {consultation_id}")
        return {"success": True, "file_url": file_url}

    except Exception as e:
        logger.error(f"Error in upload_audio_task: {str(e)}")
        try:
            if default_storage.exists(temp_file_path):
                default_storage.delete(temp_file_path)
        except Exception as clean_err:
            logger.error(f"Failed to delete temp file: {str(clean_err)}")
        return {"success": False, "error": str(e)}
