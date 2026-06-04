from rest_framework import serializers
from .models import Product, Order, OrderItem
from users.serializers import CustomUserSerializer


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'quantity', 'price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_details = CustomUserSerializer(source='user', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'user', 'user_details', 'status', 'total_amount',
            'shipping_address', 'tracking_number', 'items',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'status', 'total_amount', 'created_at', 'updated_at')
