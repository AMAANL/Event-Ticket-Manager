from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str


class EventCreate(BaseModel):
    name: str


class EventUpdate(BaseModel):
    name: str


class ScanInput(BaseModel):
    ticket_id: str
    event_id: int
    signature: str
