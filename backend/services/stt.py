"""Speech-to-Text using OpenAI Whisper API."""

import io
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

# Whisper language codes
LANGUAGE_CODES = {
    "english": "en",
    "spanish": "es",
    "french": "fr",
    "arabic": "ar",
}


async def transcribe_audio(audio_bytes: bytes, language: str) -> str:
    """Transcribe audio bytes to text using Whisper.

    Args:
        audio_bytes: Raw audio data (webm/opus from browser MediaRecorder).
        language: Target language key (e.g. "french").

    Returns:
        Transcribed text string.
    """
    lang_code = LANGUAGE_CODES.get(language, "en")

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.webm"

    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language=lang_code,
        response_format="text",
    )

    return transcript.strip()


async def transcribe_audio_auto(audio_bytes: bytes) -> str:
    """Transcribe audio allowing any language (English or target) — for beginner mode."""
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.webm"

    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="text",
    )

    return transcript.strip()
