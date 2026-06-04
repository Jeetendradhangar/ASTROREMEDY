from rest_framework import serializers
from orders.models import Product
from users.serializers import CustomUserSerializer
from .models import Consultation, VoiceNote, VoiceReply, RecommendedRemedy

class ProductMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id', 'name', 'price')


class RecommendedRemedySerializer(serializers.ModelSerializer):
    product = ProductMinimalSerializer(read_only=True)

    class Meta:
        model = RecommendedRemedy
        fields = ('product', 'instructions')


class VoiceNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceNote
        fields = ('file_url', 'duration')


class VoiceReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceReply
        fields = ('file_url', 'duration', 'astrologer')


class ConsultationSerializer(serializers.ModelSerializer):
    voice_note = serializers.SerializerMethodField()
    voice_reply = serializers.SerializerMethodField()
    recommendations = RecommendedRemedySerializer(many=True, read_only=True)
    user_details = CustomUserSerializer(source='user', read_only=True)

    class Meta:
        model = Consultation
        fields = (
            'id', 'inquiry_number', 'user', 'user_details', 'date_of_birth', 'birth_time', 'birth_place',
            'problem_desc', 'status', 'amount_paid', 'voice_note',
            'voice_reply', 'recommendations', 'created_at'
        )
        read_only_fields = ('id', 'inquiry_number', 'user', 'status', 'amount_paid', 'created_at')

    def get_voice_note(self, obj):
        note = obj.voice_notes.order_by('-created_at').first()
        if note:
            return VoiceNoteSerializer(note).data
        return None

    def get_voice_reply(self, obj):
        reply = obj.voice_replies.order_by('-created_at').first()
        if reply:
            return VoiceReplySerializer(reply).data
        return None

