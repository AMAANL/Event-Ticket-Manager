import hashlib
import io
import json

import qrcode


SECRET = "qrsecret"


def sign(ticket_id: str) -> str:
    return hashlib.sha256((ticket_id + SECRET).encode()).hexdigest()


def generate_qr_bytes(ticket_id: str, event_id: int) -> tuple[bytes, dict]:
    """Generate QR code as bytes (in-memory, not saved to disk)"""
    payload = {
        "ticket_id": ticket_id,
        "event_id": event_id,
        "signature": sign(ticket_id),
    }

    data = json.dumps(payload)
    img = qrcode.make(data)

    # Return as bytes instead of saving to file
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    return img_bytes.getvalue(), payload
