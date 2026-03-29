import json
import base64
import asyncio
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import CORS_ORIGINS, LANGUAGE_NAMES
from database import init_db, get_db, User, PracticeSession
from services.stats import aggregate_user_stats
from auth import hash_password, verify_password, create_token, get_current_user
from services.stt import transcribe_audio, transcribe_audio_auto
from services.tts import synthesize_speech, stream_speech
from services.conversation import get_ai_response
from services.immersion import get_immersion_opening, run_immersion_turn

app = FastAPI(title="Milo - Language Learning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
def on_startup():
    init_db()

# ── In-memory session store ──────────────────────────────────────────────────

sessions: dict[str, dict] = {}


# ── REST Models ──────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    language: str
    scenario: str
    beginner_mode: bool = True


class ChatRequest(BaseModel):
    session_id: str
    message: str
    beginner_mode: bool | None = None


class TtsPreviewRequest(BaseModel):
    text: str
    language: str = "spanish"


class PracticeLogRequest(BaseModel):
    duration_seconds: int = 0
    language: str = ""
    scenario: str = ""
    user_turns: int = 0
    words_practiced: int = 0


class Message(BaseModel):
    role: str
    content: str


class LegacyChatRequest(BaseModel):
    message: str
    language: str
    scenario: str
    history: list[Message] = []


# ── Auth Models ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    native_language: str | None = None


# ── Auth Endpoints ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/auth/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.email)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "native_language": user.native_language,
        },
    }


@app.post("/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.email)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "native_language": user.native_language,
        },
    }


@app.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "native_language": user.native_language,
    }


@app.post("/stats/practice")
async def log_practice_session(
    req: PracticeLogRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a completed practice session (call when the user leaves chat while logged in)."""
    duration = max(0, min(int(req.duration_seconds), 86400 * 5))
    turns = max(0, int(req.user_turns))
    words = max(0, int(req.words_practiced))
    row = PracticeSession(
        user_id=user.id,
        duration_seconds=duration,
        language=(req.language or "")[:48],
        scenario=(req.scenario or "")[:64],
        user_turns=turns,
        words_practiced=words,
    )
    db.add(row)
    db.commit()
    return {"ok": True}


@app.get("/stats/summary")
async def get_stats_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregated stats for the dashboard."""
    return aggregate_user_stats(db, user.id)


@app.put("/auth/me")
async def update_me(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.name is not None:
        user.name = req.name
    if req.email is not None:
        existing = db.query(User).filter(User.email == req.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = req.email
    if req.native_language is not None:
        user.native_language = req.native_language

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "native_language": user.native_language,
    }


# ── REST Endpoints ───────────────────────────────────────────────────────────


@app.post("/session/create")
async def create_session(req: SessionCreate):
    """Create a new learning session. Returns structured opening + TTS."""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "language": req.language,
        "scenario": req.scenario,
        "beginner_mode": req.beginner_mode,
        "history": [],
    }

    opening_data = get_immersion_opening(
        language=req.language,
        scenario=req.scenario,
        beginner_mode=req.beginner_mode,
    )
    reply_es = opening_data["response_spanish"]
    sessions[session_id]["history"].append({"role": "assistant", "content": reply_es})

    opening_audio_b64 = None
    try:
        audio_bytes = await synthesize_speech(reply_es, req.language)
        opening_audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print(f"TTS for opening failed (non-fatal): {e}")

    return {
        "session_id": session_id,
        "language": req.language,
        "scenario": req.scenario,
        "beginner_mode": req.beginner_mode,
        "opening": opening_data,
        "opening_message": reply_es,
        "opening_audio": opening_audio_b64,
    }


@app.post("/tts/preview")
async def tts_preview(req: TtsPreviewRequest):
    """Short TTS clip for pronunciation “Listen” buttons (same voice as session language)."""
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="text too long")
    try:
        audio_bytes = await synthesize_speech(text, req.language)
        return {
            "audio": base64.b64encode(audio_bytes).decode("utf-8"),
            "format": "audio/mpeg",
        }
    except Exception as e:
        print(f"TTS preview failed: {e}")
        raise HTTPException(status_code=502, detail="TTS preview failed") from e


@app.post("/chat")
async def chat(req: LegacyChatRequest):
    """Text-based chat endpoint (kept for backward compatibility)."""
    reply = get_ai_response(
        user_text=req.message,
        language=req.language,
        scenario=req.scenario,
        history=[{"role": m.role, "content": m.content} for m in req.history],
    )
    return {"reply": reply}


@app.post("/chat/text")
async def chat_text(req: ChatRequest):
    """Send a text message within a session (ImmersionAI structured turn)."""
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    beginner = (
        req.beginner_mode
        if req.beginner_mode is not None
        else session.get("beginner_mode", True)
    )

    turn = run_immersion_turn(
        user_raw=req.message,
        language=session["language"],
        scenario=session["scenario"],
        history=session["history"],
        beginner_mode=beginner,
    )

    session["history"].append(
        {"role": "user", "content": turn["user_spanish"]}
    )
    session["history"].append(
        {"role": "assistant", "content": turn["response_spanish"]}
    )

    audio_bytes = await synthesize_speech(turn["response_spanish"], session["language"])
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    return {
        "reply": turn["response_spanish"],
        "turn": turn,
        "audio": audio_b64,
        "audio_format": "audio/mpeg",
    }


@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session state including conversation history."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    return {
        "session_id": session_id,
        "language": session["language"],
        "scenario": session["scenario"],
        "history": session["history"],
    }


# ── WebSocket: Real-time voice conversation ──────────────────────────────────

@app.websocket("/ws/voice/{session_id}")
async def voice_conversation(websocket: WebSocket, session_id: str):
    """WebSocket for real-time voice conversation with Milo.

    Protocol:
    - Client sends JSON control messages:
      {"type": "start"}            → begins a new voice turn
      {"type": "audio", "data": "<base64 audio>"}  → audio chunk
      {"type": "stop"}             → end of voice turn, triggers processing
      {"type": "text", "message": "..."}  → text message (mic off mode)
      {"type": "settings", "beginner_mode": true|false}  → update session

    - Server sends JSON responses:
      {"type": "transcript", "text": "...", "raw": "...", "was_translated": bool, "correction": {...}|null}
      {"type": "response", "text": "...", "response_english": "...", "pronunciation_guide": "...", "pronunciation_items": [...], "teaching_tip": "...", "suggestions": [...]}
      {"type": "audio", "data": "<base64 audio>"}  → TTS (MP3 chunks)
      {"type": "audio_end"}
      {"type": "error", "message": "..."}
    """
    await websocket.accept()

    session = sessions.get(session_id)
    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    audio_buffer = bytearray()

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "start":
                # Client started recording
                audio_buffer = bytearray()

            elif msg_type == "settings":
                if "beginner_mode" in msg:
                    session["beginner_mode"] = bool(msg["beginner_mode"])

            elif msg_type == "audio":
                # Client sending audio chunk (base64 encoded)
                chunk = base64.b64decode(msg["data"])
                audio_buffer.extend(chunk)

            elif msg_type == "stop":
                # Client stopped recording — process the full audio
                if not audio_buffer:
                    await websocket.send_json({
                        "type": "error",
                        "message": "No audio received",
                    })
                    continue

                try:
                    beginner = session.get("beginner_mode", True)
                    if beginner:
                        transcript = await transcribe_audio_auto(bytes(audio_buffer))
                    else:
                        transcript = await transcribe_audio(
                            bytes(audio_buffer), session["language"]
                        )

                    if not transcript:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Could not understand audio",
                        })
                        continue

                    turn = run_immersion_turn(
                        user_raw=transcript,
                        language=session["language"],
                        scenario=session["scenario"],
                        history=session["history"],
                        beginner_mode=beginner,
                    )

                    session["history"].append(
                        {"role": "user", "content": turn["user_spanish"]}
                    )
                    session["history"].append(
                        {"role": "assistant", "content": turn["response_spanish"]}
                    )

                    await websocket.send_json({
                        "type": "transcript",
                        "text": turn["user_spanish"],
                        "raw": transcript,
                        "was_translated": turn["user_was_english"],
                        "correction": turn.get("correction"),
                    })

                    await websocket.send_json({
                        "type": "response",
                        "text": turn["response_spanish"],
                        "response_english": turn["response_english"],
                        "pronunciation_guide": turn["pronunciation_guide"],
                        "pronunciation_items": turn.get("pronunciation_items") or [],
                        "teaching_tip": turn.get("teaching_tip"),
                        "suggestions": turn["suggestions"],
                    })

                    async for audio_chunk in stream_speech(
                        turn["response_spanish"], session["language"]
                    ):
                        audio_b64 = base64.b64encode(audio_chunk).decode("utf-8")
                        await websocket.send_json({
                            "type": "audio",
                            "data": audio_b64,
                        })

                    await websocket.send_json({"type": "audio_end"})

                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e),
                    })

                audio_buffer = bytearray()

            elif msg_type == "text":
                text = msg.get("message", "").strip()
                if not text:
                    continue

                beginner = (
                    bool(msg["beginner_mode"])
                    if "beginner_mode" in msg
                    else session.get("beginner_mode", True)
                )
                session["beginner_mode"] = beginner

                turn = run_immersion_turn(
                    user_raw=text,
                    language=session["language"],
                    scenario=session["scenario"],
                    history=session["history"],
                    beginner_mode=beginner,
                )

                session["history"].append(
                    {"role": "user", "content": turn["user_spanish"]}
                )
                session["history"].append(
                    {"role": "assistant", "content": turn["response_spanish"]}
                )

                await websocket.send_json({
                    "type": "transcript",
                    "text": turn["user_spanish"],
                    "raw": text,
                    "was_translated": turn["user_was_english"],
                    "correction": turn.get("correction"),
                })

                await websocket.send_json({
                    "type": "response",
                    "text": turn["response_spanish"],
                    "response_english": turn["response_english"],
                    "pronunciation_guide": turn["pronunciation_guide"],
                    "pronunciation_items": turn.get("pronunciation_items") or [],
                    "teaching_tip": turn.get("teaching_tip"),
                    "suggestions": turn["suggestions"],
                })

                async for audio_chunk in stream_speech(
                    turn["response_spanish"], session["language"]
                ):
                    audio_b64 = base64.b64encode(audio_chunk).decode("utf-8")
                    await websocket.send_json({
                        "type": "audio",
                        "data": audio_b64,
                    })

                await websocket.send_json({"type": "audio_end"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
