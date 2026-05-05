from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..deps import get_db
from ..schemas import UserCreate
from ..security import create_token, hash_password, verify_password


router = APIRouter()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.Organizer).filter_by(username=user.username).first():
        raise HTTPException(status_code=400, detail="User exists")

    new_user = models.Organizer(
        username=user.username,
        password=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    return {"msg": "registered"}


@router.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.Organizer).filter_by(username=user.username).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"user_id": db_user.id})
    return {"access_token": token, "token_type": "bearer"}
