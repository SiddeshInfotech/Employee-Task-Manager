from datetime import datetime, timedelta, timezone
import bcrypt

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models import User
from app.schemas import TokenData


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="api/auth/login"
)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
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


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        username = payload.get("sub")
        user_id = payload.get("id")
        role = payload.get("role")

        if username is None or user_id is None:
            raise credentials_exception

        token_data = TokenData(
            username=username,
            user_id=user_id,
            role=role
        )

    except JWTError:
        raise credentials_exception


    user = db.query(User).filter(
        User.user_id == token_data.user_id
    ).first()


    if user is None:
        raise credentials_exception


    return user



def get_current_active_user(
    current_user: User = Depends(get_current_user)
):

    # Database मध्ये is_active column नाही,
    # म्हणून फक्त user return करतो

    return current_user



def check_admin_role(
    current_user: User = Depends(get_current_active_user)
):

    if current_user.role != "Admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

    return current_user