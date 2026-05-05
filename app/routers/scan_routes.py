from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..deps import get_current_user, get_db
from ..qr_utils import sign
from ..schemas import ScanInput


router = APIRouter()


def _mark_present(ticket: models.Ticket):
    if ticket.used:
        return {
            "status": "ALREADY PRESENT",
            "attendee_data": ticket.attendee_data,
        }

    ticket.used = True
    return {
        "status": "PRESENT MARKED",
        "attendee_data": ticket.attendee_data,
    }


def _ticket_for_organizer(ticket_id: str, db: Session, user_id: int):
    ticket = db.query(models.Ticket).filter_by(ticket_id=ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    event = (
        db.query(models.Event)
        .filter_by(id=ticket.event_id, organizer_id=user_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return ticket


@router.post("/scan")
def scan(
    data: ScanInput,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    if data.signature != sign(data.ticket_id):
        raise HTTPException(status_code=400, detail="Invalid QR code")

    ticket = _ticket_for_organizer(data.ticket_id, db, user_id)

    if ticket.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="Wrong event")

    result = _mark_present(ticket)
    db.commit()
    return result


@router.post("/scan/{ticket_id}")
def scan_ticket_id(
    ticket_id: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    ticket = _ticket_for_organizer(ticket_id, db, user_id)
    result = _mark_present(ticket)
    db.commit()
    return result
