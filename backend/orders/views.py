import os
import urllib.parse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.core import signing

from consultations.models import RecommendedRemedy
from .models import Product, Order, OrderItem
from .serializers import ProductSerializer, OrderSerializer
from consultations.permissions import IsAstrologer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to list products (database might not be migrated): {str(e)}")
            return Response([])

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAstrologer()]
        return [permissions.IsAuthenticated()]


from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_astrologer or user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        shipping_address = request.data.get('shipping_address')
        total_amount = request.data.get('total_amount')

        if not all([product_id, shipping_address, total_amount]):
            return Response({"error": "product_id, shipping_address, and total_amount are required"}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id)

        if product.stock_count < 1:
            return Response({"error": f"Product '{product.name}' is out of stock"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Deduct stock
            product.stock_count -= 1
            product.save()

            # Create Order
            order = Order.objects.create(
                user=request.user,
                shipping_address=shipping_address,
                total_amount=total_amount,
                status='received'
            )

            # Create OrderItem
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=1,
                price=product.price
            )

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    CANCELABLE_STATUSES = ['draft_lock', 'pending_whatsapp', 'received', 'confirmed']

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()

        # Only the order owner can cancel their own order
        if order.user != request.user and not (request.user.is_astrologer or request.user.is_staff):
            return Response(
                {"error": "You do not have permission to cancel this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        if order.status not in self.CANCELABLE_STATUSES:
            return Response(
                {"error": f"Order cannot be cancelled. Current status '{order.get_status_display()}' is not cancelable."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Restore stock for each order item
            for item in order.items.select_related('product').all():
                Product.objects.filter(id=item.product_id).update(
                    stock_count=F('stock_count') + item.quantity
                )

            order.status = 'cancelled'
            order.save()

        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"AUDIT LOG: Order {order.id} cancelled by user {request.user.id}")

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateOrderStatusView(APIView):
    permission_classes = [IsAstrologer]

    def patch(self, request, id):
        order = get_object_or_404(Order, id=id)
        status_val = request.data.get('status')
        tracking_number = request.data.get('tracking_number')

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if status_val and status_val not in valid_statuses:
            return Response({"error": f"Invalid status. Must be one of {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)

        if status_val:
            order.status = status_val
        if tracking_number is not None:
            order.tracking_number = tracking_number
        order.save()

        return Response({
            "id": order.id,
            "status": order.status,
            "tracking_number": order.tracking_number
        }, status=status.HTTP_200_OK)


class WhatsAppLinkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({"error": "product_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id)

        with transaction.atomic():
            # Atomically decrement stock if count >= 1
            updated_count = Product.objects.filter(
                id=product.id,
                stock_count__gte=1,
                is_active=True
            ).update(stock_count=F('stock_count') - 1)

            if updated_count == 0:
                return Response(
                    {"error": f"Product '{product.name}' is out of stock or inactive"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create Order in DRAFT_LOCK state with 15 minutes expiry window
            expires_at = timezone.now() + timezone.timedelta(minutes=15)
            order = Order.objects.create(
                user=request.user,
                shipping_address="Pending via WhatsApp",
                total_amount=product.price,
                status='draft_lock',
                expires_at=expires_at
            )

            # Create OrderItem
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=1,
                price=product.price
            )

        # Generate a signed URL-safe cryptographic token (django.core.signing)
        token_payload = {
            'order_uuid': str(order.order_uuid),
            'user_id': request.user.id,
            'product_id': product.id,
            'expires_at': expires_at.isoformat()
        }
        token = signing.dumps(token_payload)

        # Generate a professional message containing the order details
        message = (
            f"Hello AstroRemedy Support Team,\n\n"
            f"I would like to place an order for the remedy suggested by my astrologer.\n\n"
            f"Order Details:\n"
            f"• Product: {product.name} (ID: {product.id})\n"
            f"• Price: INR {product.price}\n"
            f"• Seeker Phone: {request.user.phone_number or 'N/A'}\n\n"
            f"Please guide me with the next steps for payment and shipping. Thank you!"
        )

        # Read WhatsApp business number from env
        wa_number = os.environ.get('WHATSAPP_BUSINESS_NUMBER', '919917632142')
        encoded_message = urllib.parse.quote(message)
        whatsapp_url = f"https://wa.me/{wa_number}?text={encoded_message}"

        # Audit log creation
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"AUDIT LOG: Created draft lock order {order.id} (UUID: {order.order_uuid}) for user {request.user.id}")

        return Response({"whatsapp_url": whatsapp_url}, status=status.HTTP_200_OK)


