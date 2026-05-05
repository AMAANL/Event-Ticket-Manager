from sqlalchemy import Boolean, Column, ForeignKey, Integer, JSON, String

from .database import Base


class Organizer(Base):
    __tablename__ = "organizers"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    organizer_id = Column(Integer, ForeignKey("organizers.id"), nullable=False)
    field_schema = Column(JSON, default=list, nullable=False)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True, nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    attendee_data = Column(JSON, default=dict, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
