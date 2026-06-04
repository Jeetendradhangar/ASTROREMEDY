import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def seed():
    print("Seeding database...")

    # 1. Create admin / astrologer account if it doesn't exist
    astrologer_email = 'astrologer@example.com'
    if not User.objects.filter(email=astrologer_email).exists():
        User.objects.create_superuser(
            email=astrologer_email,
            username='astrologer',
            phone_number='+919999999999',
            password='password123',
            is_astrologer=True
        )
        print(f"Created astrologer admin account: {astrologer_email} / password123")
    else:
        print(f"Astrologer admin account already exists: {astrologer_email}")

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
