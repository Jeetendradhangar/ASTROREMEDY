from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from reviews.models import Review

User = get_user_model()

class ReviewFilteringTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.seeker = User.objects.create_user(
            email="seeker@example.com",
            username="seeker",
            phone_number="+919876543210",
            password="testpassword123"
        )
        self.astrologer = User.objects.create_user(
            email="astrologer@example.com",
            username="astrologer",
            phone_number="+919876543211",
            password="testpassword123",
            is_astrologer=True
        )
        
        # Create approved review
        self.approved_review = Review.objects.create(
            user=self.seeker,
            rating=5,
            comment="Wonderful consultation, highly recommended!",
            is_approved=True
        )
        # Create unapproved review
        self.unapproved_review = Review.objects.create(
            user=self.seeker,
            rating=2,
            comment="Terrible advice.",
            is_approved=False
        )
        
        self.url = reverse('review-list')  # Check reviews/urls.py for router naming, usually basename='review' results in 'review-list'

    def test_public_anonymous_user_can_only_see_approved_reviews(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response only has approved reviews
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
        else:
            results = data
            
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.approved_review.id)
        self.assertTrue(results[0]["is_approved"])

    def test_seeker_user_can_only_see_approved_reviews(self):
        self.client.force_authenticate(user=self.seeker)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response only has approved reviews
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
        else:
            results = data
            
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.approved_review.id)
        self.assertTrue(results[0]["is_approved"])

    def test_astrologer_user_can_see_all_reviews(self):
        self.client.force_authenticate(user=self.astrologer)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response has both reviews
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
        else:
            results = data
            
        self.assertEqual(len(results), 2)
        ids = [r["id"] for r in results]
        self.assertIn(self.approved_review.id, ids)
        self.assertIn(self.unapproved_review.id, ids)
