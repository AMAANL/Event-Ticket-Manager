from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .routers import auth_routes, event_routes, scan_routes, ticket_routes


init_db()

app = FastAPI(title="Event Ticket System")

app.include_router(auth_routes.router)
app.include_router(event_routes.router)
app.include_router(ticket_routes.router)
app.include_router(scan_routes.router)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse("static/index.html")
