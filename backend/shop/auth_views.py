"""Customer session authentication. Email confirmation is intentionally optional."""
import hashlib
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.cache import never_cache
from .views import body, error, limited

def identity(email):
    return "customer_" + hashlib.sha256(email.encode()).hexdigest()

def customer(user):
    return {"name": user.first_name, "email": user.email}

@never_cache
@require_GET
def account(request):
    if not request.user.is_authenticated:
        return error("Please log in to continue.", 401)
    return JsonResponse({"customer": customer(request.user)})

@never_cache
@require_POST
def signup(request):
    if limited(request, "signup", maximum=10):
        return error("Too many attempts. Please try again in five minutes.", 429)
    try:
        data = body(request)
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        if not name or len(name) > 150:
            return error("Enter your name (up to 150 characters).")
        validate_email(email)
        if len(email) > 254 or not isinstance(password, str) or len(password) > 128:
            return error("Check your email and password length.")
        User = get_user_model()
        user = User(username=identity(email), email=email, first_name=name)
        validate_password(password, user)
        if User.objects.filter(email__iexact=email).exists():
            return error("Unable to create this account. Try logging in or use another email.")
        with transaction.atomic():
            user.set_password(password)
            user.save()
    except ValidationError as exc:
        return error(" ".join(exc.messages))
    except (ValueError, TypeError):
        return error("Please enter valid account details.")
    except IntegrityError:
        return error("Unable to create this account. Try logging in or use another email.")
    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return JsonResponse({"customer": customer(user)}, status=201)

@never_cache
@require_POST
def signin(request):
    if limited(request, "login", maximum=20):
        return error("Too many attempts. Please try again in five minutes.", 429)
    try:
        data = body(request)
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        if len(email) > 254 or not isinstance(password, str) or len(password) > 128:
            return error("Email or password is incorrect.", 401)
        user = authenticate(request, username=identity(email), password=password)
    except (ValueError, TypeError):
        return error("Please enter valid account details.")
    if user is None:
        return error("Email or password is incorrect.", 401)
    login(request, user)
    return JsonResponse({"customer": customer(user)})

@never_cache
@require_POST
def signout(request):
    logout(request)
    return JsonResponse({"ok": True})
