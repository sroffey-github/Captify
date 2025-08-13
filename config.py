from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    # 500MB
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH_MB", "500")) * 1024 * 1024

    BASE_DIR = Path(__file__).resolve().parent
    UPLOAD_FOLDER = os.environ.get(
        "UPLOAD_FOLDER",
        str((BASE_DIR / "uploads").resolve())
    )

    ALLOWED_EXTENSIONS = set(
        os.environ.get("ALLOWED_EXTENSIONS", "mp4").lower().split(",")
    )

    JSONIFY_PRETTYPRINT_REGULAR = True
    PREFERRED_URL_SCHEME = os.environ.get("PREFERRED_URL_SCHEME", "http")


class DevConfig(Config):
    DEBUG = True