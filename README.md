# Event Ticket Manager

A modern, mobile-responsive event ticketing system with QR code generation, attendee management, and entry scanning capabilities.

## <img width="1269" height="749" alt="Screenshot 2026-05-05 at 11 40 25 PM" src="https://github.com/user-attachments/assets/e17d1f08-0f7f-4d0e-8d43-47399b26c4c2" />


## <img width="1467" height="829" alt="Screenshot 2026-05-05 at 11 32 48 PM" src="https://github.com/user-attachments/assets/56b5515e-eb6f-4f3e-a8b9-4ea26537a576" />

## <img width="1358" height="816" alt="Screenshot 2026-05-05 at 11 38 38 PM" src="https://github.com/user-attachments/assets/f822d0a3-9994-42d0-82d5-8ce65f67f5c7" />


## Features

✅ **Event Management** - Create and manage multiple events  
✅ **Attendee Import** - Import attendees from CSV, JSON, or XLSX files  
✅ **QR Code Generation** - Generate unique QR codes for each ticket on-demand  
✅ **QR Scanning** - Scan QR codes at entry to mark attendance  
✅ **Mobile Responsive** - Fully responsive design works on desktop, tablet, and mobile  
✅ **Real-time Attendance** - Track ticket usage and attendance in real-time  
✅ **Data Export** - Download QR code JSON and attendance reports

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLAlchemy with SQLite
- **Authentication**: JWT-based organizer login
- **QR Codes**: Python qrcode library

## Getting Started

### Prerequisites

- Python 3.8+
- pip or pipenv

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AMAANL/Event-Ticket-Manager.git
cd Event-Ticket-Manager
```

2. Create virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

```bash
./run.sh
# or
python -m uvicorn app.main:app --reload
```

The application will be available at `http://localhost:8000`

## Project Structure

```
event_ticket/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app setup
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── security.py          # JWT authentication
│   ├── deps.py              # Dependency injection
│   ├── qr_utils.py          # QR code generation (on-demand)
│   └── routers/
│       ├── auth_routes.py   # Login/register endpoints
│       ├── event_routes.py  # Event management endpoints
│       ├── ticket_routes.py # Ticket and QR endpoints
│       └── scan_routes.py   # QR scanning endpoints
├── static/
│   ├── index.html           # Main frontend
│   ├── app.js               # Frontend logic
│   └── styles.css           # Responsive styling
├── requirements.txt         # Python dependencies
└── run.sh                   # Start script
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new organizer
- `POST /auth/login` - Login organizer
- `POST /auth/logout` - Logout organizer

### Events
- `POST /events/` - Create event
- `GET /events/` - List user's events
- `PUT /events/{event_id}` - Update event
- `DELETE /events/{event_id}` - Delete event

### Tickets
- `POST /ticket/{event_id}` - Issue single ticket
- `POST /event/{event_id}/import` - Import attendees
- `GET /event/{event_id}/tickets` - List event tickets
- `GET /tickets/{ticket_id}/qr` - Get QR code image (on-demand)

### Scanning
- `POST /scan/verify` - Verify and mark ticket as scanned

## QR Code Implementation

QR codes are generated **on-demand** and served dynamically:

- Each QR code contains: `ticket_id`, `event_id`, and cryptographic `signature`
- QR codes are generated in-memory (no disk storage)
- Endpoint: `GET /tickets/{ticket_id}/qr` returns PNG image
- Benefits: Works on serverless, Docker, and GitHub Pages deployments

## Mobile Responsiveness

The application is fully responsive with:
- Touch-friendly button sizes (44px minimum)
- Readable typography at all screen sizes
- Optimized layouts for phones, tablets, and desktops
- Smooth scrolling and swipe gestures supported
- Camera scanner works on mobile devices

## Deployment

### Docker
```bash
docker build -t event-ticket-manager .
docker run -p 8000:8000 event-ticket-manager
```

### GitHub Pages / Serverless
Works out-of-the-box because QR codes are generated on-demand (no file persistence needed).

## Environment Variables

Create a `.env` file in the project root:
```
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---


