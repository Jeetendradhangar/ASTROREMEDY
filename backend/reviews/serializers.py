from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_email', 'consultation', 'rating', 'comment', 'is_approved', 'created_at')
        read_only_fields = ('id', 'user', 'is_approved', 'created_at')

    def validate_consultation(self, value):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            is_admin_or_astrologer = user.is_authenticated and (
                getattr(user, 'is_astrologer', False) or getattr(user, 'is_staff', False)
            )
            if is_admin_or_astrologer:
                return value

            if value.user != request.user:
                raise serializers.ValidationError("You can only review your own consultations.")
            if value.status not in ['replied', 'closed']:
                raise serializers.ValidationError("You can only review consultations that have been replied or closed.")
        return value
