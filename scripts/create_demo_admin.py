"""Create a local-only demo administrator. Never runs automatically in production."""
import os, sys, secrets
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/"backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE","config.settings")
import django
django.setup()
from django.conf import settings
from django.contrib.auth import get_user_model
if not settings.DEBUG:
    raise SystemExit("Demo administrator creation is disabled in production.")
User=get_user_model()
if User.objects.filter(username="demo_admin").exists():
    print("Local demo administrator already exists; credentials were not changed.")
else:
    password=secrets.token_urlsafe(24)
    User.objects.create_superuser("demo_admin","demo@example.invalid",password)
    folder=root/".local"
    folder.mkdir(exist_ok=True)
    (folder/"admin-access.txt").write_text("KAHLID FABRIC — LOCAL DEMO ONLY\n\nURL: http://127.0.0.1:8000/admin/\nUsername: demo_admin\nPassword: "+password+"\n\nKeep this file private. It is excluded from source control.\n",encoding="utf-8")
    print("Local demo administrator created. Credentials saved in .local/admin-access.txt.")
