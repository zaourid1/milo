"""Text-to-Speech using ElevenLabs API."""

import httpx
from config import ELEVENLABS_API_KEY, ELEVENLABS_VOICES, ELEVENLABS_MODEL

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"


async def synthesize_speech(text: str, language: str) -> bytes:
    """Convert text to speech audio using ElevenLabs.

    Args:
        text: The text to speak.
        language: Language key (e.g. "french") to select voice.

    Returns:
        MP3 audio bytes.
    """
    voice_id = ELEVENLABS_VOICES.get(language, ELEVENLABS_VOICES["english"])

    url = f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.content


async def stream_speech(text: str, language: str):
    """Stream TTS audio chunks from ElevenLabs.

    Yields MP3 audio chunks as they arrive.
    """
    voice_id = ELEVENLABS_VOICES.get(language, ELEVENLABS_VOICES["english"])

    url = f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}/stream"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(chunk_size=4096):
                yield chunk
