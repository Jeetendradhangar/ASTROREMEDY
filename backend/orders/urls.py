from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ProductViewSet, OrderViewSet, UpdateOrderStatusView, WhatsAppLinkView

router = SimpleRouter()
router.register('products', ProductViewSet, basename='product')
router.register('', OrderViewSet, basename='order')

urlpatterns = [
    path('whatsapp-link/', WhatsAppLinkView.as_view(), name='order_whatsapp_link'),
    path('<int:id>/status/', UpdateOrderStatusView.as_view(), name='order_update_status'),
    path('', include(router.urls)),
]
