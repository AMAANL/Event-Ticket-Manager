from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = "sqlite:///./tickets.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as conn:
        if "events" in table_names:
            event_columns = {column["name"] for column in inspector.get_columns("events")}
            if "field_schema" not in event_columns:
                conn.execute(text("ALTER TABLE events ADD COLUMN field_schema JSON DEFAULT '[]' NOT NULL"))

        if "tickets" in table_names:
            ticket_columns = {column["name"] for column in inspector.get_columns("tickets")}
            if "attendee_data" not in ticket_columns:
                conn.execute(text("ALTER TABLE tickets ADD COLUMN attendee_data JSON DEFAULT '{}' NOT NULL"))
