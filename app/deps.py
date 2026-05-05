from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from .database import SessionLocal
from .security import verify_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = verify_token(token)
        return payload["user_id"]
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
