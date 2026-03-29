import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# ElevenLabs voice IDs per language
# These are default multilingual voices — swap with your preferred voice IDs
ELEVENLABS_VOICES = {
    "english": "21m00Tcm4TlvDq8ikWAM",   # Rachel
    "spanish": "21m00Tcm4TlvDq8ikWAM",    # Rachel (multilingual)
    "french": "21m00Tcm4TlvDq8ikWAM",     # Rachel (multilingual)
    "arabic": "21m00Tcm4TlvDq8ikWAM",     # Rachel (multilingual)
}

# ElevenLabs model — multilingual v2 supports all 4 languages
ELEVENLABS_MODEL = "eleven_multilingual_v2"

SCENARIO_PERSONAS = {
    "coffee_shop": "You are a barista at a busy coffee shop.",
    "airport": "You are an airline check-in agent at an international airport.",
    "job_interview": "You are a professional hiring manager conducting a job interview.",
}

LANGUAGE_NAMES = {
    "english": "English",
    "french": "French",
    "spanish": "Spanish",
    "arabic": "Arabic",
}

# Display / persona name per target language (ImmersionAI)
ASSISTANT_NAMES = {
    "spanish": "Mateo",
    "french": "Milo",
    "arabic": "Milo",
    "english": "Milo",
}

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Auth
JWT_SECRET = os.getenv("JWT_SECRET", "milo-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./milo.db")
