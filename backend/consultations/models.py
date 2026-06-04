from django.db import models
from django.conf import settings

class Consultation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('paid', 'Paid — Awaiting Review'),
        ('in_review', 'Under Review'),
        ('replied', 'Response Sent'),
        ('closed', 'Closed'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='consultations'
    )
    date_of_birth = models.DateField()
    birth_time = models.TimeField()
    birth_place = models.CharField(max_length=200)
    problem_desc = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    inquiry_number = models.PositiveIntegerField(null=True, blank=True, db_index=True, editable=False)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.inquiry_number is None and self.user_id is not None:
            from django.db.models import Max
            max_num = Consultation.objects.filter(user_id=self.user_id).aggregate(Max('inquiry_number'))['inquiry_number__max']
            self.inquiry_number = (max_num or 0) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Consultation {self.id} (Inquiry #{self.inquiry_number}) ({self.user.email}) - {self.status}"


class VoiceNote(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name='voice_notes'
    )
    file_url = models.URLField(max_length=255)
    duration = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VoiceNote for Consultation {self.consultation.id}"


class VoiceReply(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name='voice_replies'
    )
    astrologer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='voice_replies'
    )
    file_url = models.URLField(max_length=255)
    duration = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VoiceReply for Consultation {self.consultation.id}"


class RecommendedRemedy(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name='recommendations'
    )
    product = models.ForeignKey(
        'orders.Product',
        on_delete=models.PROTECT,
        related_name='remedy_recommendations'
    )
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Remedy {self.product.name} for Consultation {self.consultation.id}"

