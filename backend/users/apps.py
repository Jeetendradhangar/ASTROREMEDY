import sys
from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        # Auto-run makemigrations and migrate programmatically on start/auto-reload
        if 'runserver' in sys.argv:
            import os
            if os.environ.get('RUN_MAIN') == 'true':
                try:
                    from django.core.management import call_command
                    print("\n[PROGRAMMATIC MIGRATION] Starting database migrations...")
                    call_command('makemigrations')
                    call_command('migrate')
                    print("[PROGRAMMATIC MIGRATION] Database migrations complete!\n")
                except Exception as e:
                    print(f"\n[PROGRAMMATIC MIGRATION ERROR] Failed to run migrations: {e}\n")
