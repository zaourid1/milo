# Milo - AI Language Learning Platform

Milo is a real-time, voice-powered language learning app that immerses you in lifelike conversations. Choose a language (French, Spanish, or Arabic), pick a real-world scenario (coffee shop, airport, or job interview), and practice speaking with Milo, an AI tutor that listens, responds with natural speech, corrects your mistakes, and coaches your pronunciation — all in real time.

## Features

- **Real-time voice conversations** — Speak into your mic; Milo listens (OpenAI Whisper STT), understands, and talks back (ElevenLabs TTS) like a real conversation partner.
- **Structured immersion turns** — Every response includes the target-language reply, an English translation, pronunciation guides with listen buttons, grammar/teaching tips, and suggested follow-up phrases.
- **Beginner mode** — Toggle beginner mode to type in English; Milo translates your input and gently corrects you.
- **Voice Activity Detection (VAD)** — RMS-based detection automatically knows when you start and stop talking.
- **3D mascot on the landing page** — An interactive, 360-degree rotatable 3D model of Milo built with React Three Fiber.
- **JWT authentication** — Sign up, log in, manage your profile; sessions are protected.
- **Session statistics** — Track practice time, turns, and words practiced.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, React Three Fiber |
| Backend | FastAPI, Python 3.11+, SQLAlchemy, SQLite |
| AI / Voice | OpenAI GPT-4o (conversation), OpenAI Whisper (speech-to-text), ElevenLabs (text-to-speech) |
| Real-time | WebSocket (FastAPI native) |
| Auth | JWT + bcrypt |

## Project Structure

```
milo/
├── backend/
│   ├── main.py              # FastAPI app — REST + WebSocket endpoints
│   ├── auth.py              # Registration, login, profile (JWT)
│   ├── config.py            # API keys, voice IDs, scenario personas
│   ├── database.py          # SQLAlchemy models & DB setup
│   ├── services/
│   │   ├── conversation.py  # GPT-4o system prompts & chat completions
│   │   ├── immersion.py     # Structured immersion turns (corrections, tips, pronunciation)
│   │   ├── stt.py           # OpenAI Whisper speech-to-text
│   │   ├── tts.py           # ElevenLabs text-to-speech (streaming)
│   │   └── stats.py         # Practice session statistics
│   ├── requirements.txt
│   └── .env.example         # Template for required environment variables
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Landing page with 3D Milo model
│   │   ├── login/page.tsx   # Login page
│   │   ├── signup/page.tsx  # Registration page
│   │   ├── dashboard/page.tsx # Language & scenario selector
│   │   ├── chat/page.tsx    # Main voice/text conversation session
│   │   ├── profile/page.tsx # User profile settings
│   │   └── select/page.tsx  # Alternate setup page
│   ├── components/
│   │   └── MiloModel.tsx    # 3D mascot viewer (React Three Fiber)
│   ├── public/models/
│   │   └── milo.glb         # 3D Milo mascot model
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.11+
- An **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- An **ElevenLabs API key** ([get one here](https://elevenlabs.io/app/settings/api-keys))

### 1. Clone the repository

```bash
git clone https://github.com/your-username/milo.git
cd milo
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your real API keys:
#   OPENAI_API_KEY=sk-proj-...
#   ELEVENLABS_API_KEY=sk_...
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# No additional env config needed — the frontend calls localhost:8000
```

### 4. Run the app

Open **two terminals**:

**Terminal 1 — Backend** (from `backend/`):
```bash
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend** (from `frontend/`):
```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Powers GPT-4o conversations and Whisper transcription |
| `ELEVENLABS_API_KEY` | Yes | Powers Milo's voice (multilingual TTS) |
| `JWT_SECRET` | No | Secret for signing auth tokens (defaults to a dev value) |
| `DATABASE_URL` | No | Database connection string (defaults to SQLite `milo.db`) |

## How It Works

1. **Sign up / Log in** — Create an account to save your progress.
2. **Pick a language and scenario** — Choose French, Spanish, or Arabic and a real-world situation.
3. **Start talking** — Click the mic button and speak. Milo transcribes your speech in real time via Whisper.
4. **Milo responds** — GPT-4o generates a contextual, in-character reply. ElevenLabs converts it to natural speech that plays back instantly.
5. **Learn as you go** — Each turn shows corrections, pronunciation coaching, grammar tips, and suggested follow-up phrases.

## Team

- **Zineb Aourid** — Full-stack development, UI/UX design, AI integration

## License

This project was built for educational purposes.
