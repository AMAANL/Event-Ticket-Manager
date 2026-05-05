import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta

from jose import jwt


SECRET_KEY = "supersecret"
ALGORITHM = "HS256"
PASSWORD_ITERATIONS = 260_000
PASSWORD_PREFIX = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return "$".join(
        [
            PASSWORD_PREFIX,
            str(PASSWORD_ITERATIONS),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(digest).decode("ascii"),
        ]
    )


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        prefix, iterations, salt, expected_digest = hashed_password.split("$", 3)
        if prefix != PASSWORD_PREFIX:
            return False

        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            base64.b64decode(salt),
            int(iterations),
        )
        return hmac.compare_digest(
            base64.b64encode(digest).decode("ascii"),
            expected_digest,
        )
    except Exception:
        return False


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=10)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
