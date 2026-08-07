import jwt
import bcrypt
from django.conf import settings
from rest_framework import authentication, exceptions
from api.models import User


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if plain_password == hashed_password:
        return True
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        try:
            token_type, token = auth_header.split(" ")
            if token_type.lower() != "bearer":
                return None
        except ValueError:
            return None

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("id")
            if not user_id:
                raise exceptions.AuthenticationFailed("Invalid token payload")
        except jwt.PyJWTError:
            raise exceptions.AuthenticationFailed("Invalid or expired token")

        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("User not found")

        # Set standard fields on user instance for compatibility
        user.is_authenticated = True
        return (user, token)
