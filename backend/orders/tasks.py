import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from django.db.models import F
from .models import Order, Product

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_draft_orders():
    now = timezone.now()
    expired_orders = Order.objects.filter(status='draft_lock', expires_at__lt=now)
    count = expired_orders.count()
    if count == 0:
        return "No expired draft lock orders found."

    processed = 0
    for order in expired_orders:
        try:
            with transaction.atomic():
                # Lock the order for update
                order = Order.objects.select_for_update().get(id=order.id)
                if order.status != 'draft_lock':
                    continue

                for item in order.items.select_for_update():
                    Product.objects.filter(id=item.product.id).update(
                        stock_count=F('stock_count') + item.quantity
                    )
                    logger.info(f"AUDIT LOG: Restored {item.quantity} stock for Product '{item.product.name}' (ID: {item.product.id}) due to draft lock expiration on Order {order.id}")

                order.status = 'cancelled'
                order.save()
                processed += 1
                logger.info(f"AUDIT LOG: Cancelled expired draft order {order.id} (UUID: {order.order_uuid}) at {timezone.now()}")
        except Exception as e:
            logger.exception(f"Error cancelling expired draft order {order.id}: {str(e)}")

    return f"Processed {processed} of {count} expired draft orders."
