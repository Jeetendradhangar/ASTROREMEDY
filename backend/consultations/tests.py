from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import transaction
from consultations.models import Consultation, VoiceNote, VoiceReply

User = get_user_model()

class ConsultationRelationalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="seeker@example.com",
            username="seeker",
            phone_number="+919876543210",
            password="testpassword123"
        )
        self.consultation = Consultation.objects.create(
            user=self.user,
            inquiry_number=1,
            date_of_birth="1995-05-15",
            birth_time="14:30:00",
            birth_place="New Delhi",
            problem_desc="Career decisions",
            amount_paid=500.00,
            status="pending"
        )

    def test_voice_note_and_reply_are_foreign_keys(self):
        # We can add multiple voice notes to the same consultation
        vn1 = VoiceNote.objects.create(
            consultation=self.consultation,
            file_url="https://cloudinary.com/note1.mp3"
        )
        vn2 = VoiceNote.objects.create(
            consultation=self.consultation,
            file_url="https://cloudinary.com/note2.mp3"
        )
        
        # Verify related lookup
        self.assertEqual(self.consultation.voice_notes.count(), 2)
        
        # We can also add multiple voice replies to the same consultation
        vr1 = VoiceReply.objects.create(
            consultation=self.consultation,
            file_url="https://cloudinary.com/reply1.mp3",
            astrologer=self.user
        )
        vr2 = VoiceReply.objects.create(
            consultation=self.consultation,
            file_url="https://cloudinary.com/reply2.mp3",
            astrologer=self.user
        )
        
        # Verify related lookup
        self.assertEqual(self.consultation.voice_replies.count(), 2)
