from django.urls import path
from .views import CreateOrderView, VerifyPaymentView, PaymentWebhookView

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='payment_create_order'),
    path('verify/', VerifyPaymentView.as_view(), name='payment_verify'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment_webhook'),
]
