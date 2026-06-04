from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    ConsultationViewSet,
    UploadVoiceNoteView,
    GetVoiceReplyView,
    UpdateStatusView,
    UploadVoiceReplyView,
)

router = SimpleRouter()
router.register('', ConsultationViewSet, basename='consultation')

urlpatterns = [
    path('<int:id>/upload-voice/', UploadVoiceNoteView.as_view(), name='consultation_upload_voice'),
    path('<int:id>/voice-reply/', GetVoiceReplyView.as_view(), name='consultation_voice_reply'),
    path('<int:id>/status/', UpdateStatusView.as_view(), name='consultation_update_status'),
    path('<int:id>/reply/', UploadVoiceReplyView.as_view(), name='consultation_reply'),
    path('', include(router.urls)),
]
