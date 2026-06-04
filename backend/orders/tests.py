import urllib.parse
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core import signing
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from orders.models import Product, Order, OrderItem
from orders.tasks import cleanup_expired_draft_orders

User = get_user_model()

class WhatsAppLinkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="seeker@example.com",
            username="seeker",
            phone_number="+919876543210",
            password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)
        
        self.product = Product.objects.create(
            name="Holy Rudraksha Bead",
            price=1500.00,
            stock_count=5,
            is_active=True
        )
        self.url = reverse('order_whatsapp_link')  # Check backend/orders/urls.py for the exact name if needed

    def test_whatsapp_link_success_and_draft_lock(self):
        # Initial check
        self.assertEqual(self.product.stock_count, 5)
        
        response = self.client.get(f"{self.url}?product_id={self.product.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response contains whatsapp_url
        whatsapp_url = response.data.get("whatsapp_url")
        self.assertIsNotNone(whatsapp_url)
        
        # Verify URL is structured correctly
        parsed_url = urllib.parse.urlparse(whatsapp_url)
        self.assertEqual(parsed_url.netloc, "wa.me")
        
        # Verify query parameters
        query_params = urllib.parse.parse_qs(parsed_url.query)
        self.assertIn("text", query_params)
        
        # Extract signed token and message details from query parameter
        message_text = query_params["text"][0]
        
        # Verify professional message contains relevant plain-text details
        self.assertIn("Holy Rudraksha Bead", message_text)
        self.assertIn("1500.00", message_text)
        self.assertIn("seeker@example.com", message_text)
        
        # Extract token (the line right after "Verification Token (please do not modify):")
        lines = [line.strip() for line in message_text.strip().split('\n') if line.strip()]
        token_index = lines.index("Verification Token (please do not modify):") + 1
        token = lines[token_index]
        
        # Verify token is cryptographic and can be parsed
        token_data = signing.loads(token)
        self.assertIn("order_uuid", token_data)
        self.assertEqual(token_data["user_id"], self.user.id)
        self.assertEqual(token_data["product_id"], self.product.id)
        
        # Verify stock has been decremented
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_count, 4)
        
        # Verify draft order exists
        order = Order.objects.get(order_uuid=token_data["order_uuid"])
        self.assertEqual(order.status, "draft_lock")
        self.assertEqual(order.total_amount, self.product.price)
        self.assertIsNotNone(order.expires_at)


    def test_whatsapp_link_out_of_stock(self):
        # Drain stock
        self.product.stock_count = 0
        self.product.save()
        
        response = self.client.get(f"{self.url}?product_id={self.product.id}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("out of stock", response.data.get("error", "").lower())


class ExpiryWorkerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="seeker2@example.com",
            username="seeker2",
            phone_number="+919876543211",
            password="testpassword123"
        )
        self.product = Product.objects.create(
            name="Sacred Gemstone",
            price=2500.00,
            stock_count=2,
            is_active=True
        )

    def test_cleanup_expired_draft_orders(self):
        # Create an expired draft order
        expired_time = timezone.now() - timezone.timedelta(minutes=1)
        order = Order.objects.create(
            user=self.user,
            shipping_address="Test Address",
            total_amount=self.product.price,
            status="draft_lock",
            expires_at=expired_time
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            price=self.product.price
        )
        
        # Stock was already decremented by 1 when order was "initiated", so simulate that state:
        self.product.stock_count = 1
        self.product.save()
        
        # Run cleanup task
        result = cleanup_expired_draft_orders()
        self.assertIn("Processed 1 of 1 expired draft orders", result)
        
        # Verify order state is cancelled
        order.refresh_from_db()
        self.assertEqual(order.status, "cancelled")
        
        # Verify product stock is restored
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_count, 2)
