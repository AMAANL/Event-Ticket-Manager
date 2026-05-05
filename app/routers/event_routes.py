from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..deps import get_current_user, get_db
from ..schemas import EventCreate, EventUpdate


router = APIRouter()


@router.post("/event")
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    ev = models.Event(name=event.name, organizer_id=user_id)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("/events")
def list_events(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    return (
        db.query(models.Event)
        .filter_by(organizer_id=user_id)
        .order_by(models.Event.id.desc())
        .all()
    )


@router.put("/event/{event_id}")
def update_event(
    event_id: int,
    event: EventUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    existing_event = (
        db.query(models.Event)
        .filter_by(id=event_id, organizer_id=user_id)
        .first()
    )
    if not existing_event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing_event.name = event.name
    db.commit()
    db.refresh(existing_event)
    return existing_event
