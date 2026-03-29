"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

const LANGUAGE_LABELS: Record<string, string> = {
  french: "French",
  spanish: "Spanish",
  arabic: "Arabic",
  english: "English",
};

const SCENARIO_LABELS: Record<string, string> = {
  coffee_shop: "Coffee Shop",
  airport: "Airport",
  job_interview: "Job Interview",
};

function coachName(language: string) {
  return language === "spanish" ? "Mateo" : "Milo";
}

type Correction = { original: string; corrected: string; note?: string };

type UserChatMessage = {
  id: string;
  role: "user";
  spanish: string;
  raw?: string;
  wasTranslated?: boolean;
  correction?: Correction | null;
};

type AssistantChatMessage = {
  id: string;
  role: "assistant";
  spanish: string;
  english: string;
  pronunciation: string | null;
  suggestions: string[];
};

type ChatMessage = UserChatMessage | AssistantChatMessage;

function AmbientBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -top-48 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-amber-300/45 blur-[100px]" />
      <div className="absolute top-[30%] -left-40 h-[22rem] w-[22rem] rounded-full bg-violet-200/50 blur-[90px]" />
      <div className="absolute bottom-[-15%] right-[20%] h-[24rem] w-[24rem] rounded-full bg-orange-200/40 blur-[100px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(253,230,138,0.35),transparent_55%)]" />
    </div>
  );
}

function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/70 bg-white/50 shadow-clay backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function uid() {
  return crypto.randomUUID();
}

function SessionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const language = params.get("language") || "spanish";
  const scenario = params.get("scenario") || "coffee_shop";
  const beginnerParam = params.get("beginner");
  const initialBeginner = beginnerParam !== "0" && beginnerParam !== "false";

  const langLabel = LANGUAGE_LABELS[language] || language;
  const scenarioLabel = SCENARIO_LABELS[scenario] || scenario;
  const partner = coachName(language);

  const [beginnerMode, setBeginnerMode] = useState(initialBeginner);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [miloSpeaking, setMiloSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const beginnerModeRef = useRef(beginnerMode);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const miloSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);

  const incomingAudioRef = useRef<Uint8Array[]>([]);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, miloSpeaking, isProcessing]);

  useEffect(() => {
    miloSpeakingRef.current = miloSpeaking;
  }, [miloSpeaking]);
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "settings", beginner_mode: beginnerMode }));
    }
  }, [beginnerMode]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      console.error("Camera denied:", e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (cameraOn) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [cameraOn, startCamera, stopCamera]);

  const playMp3Blob = useCallback((blob: Blob): Promise<void> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      if (!audioElRef.current) audioElRef.current = new Audio();
      const audio = audioElRef.current;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.src = url;
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        resolve();
      });
    });
  }, []);

  const drainAudioQueue = useCallback(async () => {
    if (isPlayingRef.current) return;
    if (audioQueueRef.current.length === 0) {
      setMiloSpeaking(false);
      return;
    }
    isPlayingRef.current = true;
    setMiloSpeaking(true);
    while (audioQueueRef.current.length > 0) {
      const blob = audioQueueRef.current.shift()!;
      await playMp3Blob(blob);
    }
    isPlayingRef.current = false;
    setMiloSpeaking(false);
  }, [playMp3Blob]);

  const playBase64Audio = useCallback(
    (b64: string) => {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      audioQueueRef.current.push(blob);
      setMiloSpeaking(true);
      drainAudioQueue();
    },
    [drainAudioQueue]
  );

  const [sessionStarting, setSessionStarting] = useState(false);

  const connectWebSocket = useCallback(
    (sid: string) => {
      const ws = new WebSocket(`ws://localhost:8000/ws/voice/${sid}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        ws.send(
          JSON.stringify({
            type: "settings",
            beginner_mode: beginnerModeRef.current,
          })
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "transcript":
            setIsProcessing(true);
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: "user",
                spanish: msg.text || "",
                raw: msg.raw,
                wasTranslated: msg.was_translated,
                correction: msg.correction ?? null,
              },
            ]);
            break;

          case "response":
            setIsProcessing(false);
            setMiloSpeaking(true);
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: "assistant",
                spanish: msg.text || "",
                english: msg.response_english || "",
                pronunciation: msg.pronunciation_guide ?? null,
                suggestions: Array.isArray(msg.suggestions)
                  ? msg.suggestions
                  : [],
              },
            ]);
            break;

          case "audio": {
            const bin = atob(msg.data);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            incomingAudioRef.current.push(arr);
            break;
          }

          case "audio_end": {
            const chunks = incomingAudioRef.current;
            if (chunks.length > 0) {
              const total = chunks.reduce((n, c) => n + c.length, 0);
              const merged = new Uint8Array(total);
              let off = 0;
              for (const c of chunks) {
                merged.set(c, off);
                off += c.length;
              }
              audioQueueRef.current.push(new Blob([merged], { type: "audio/mpeg" }));
              drainAudioQueue();
            } else setMiloSpeaking(false);
            incomingAudioRef.current = [];
            break;
          }

          case "error":
            console.error("[ImmersionAI]", msg.message);
            setIsProcessing(false);
            setMiloSpeaking(false);
            break;
        }
      };

      ws.onerror = () => setConnectionStatus("error");
      ws.onclose = () => console.log("[ImmersionAI] WS closed");
    },
    [drainAudioQueue]
  );

  const handleStartSession = useCallback(async () => {
    if (!audioElRef.current) audioElRef.current = new Audio();
    audioElRef.current.src =
      "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlmOZLAAAAAAAAAAAAAAAAAAAA";
    audioElRef.current.play().catch(() => {});

    setSessionStarting(true);
    setConnectionStatus("connecting");
    try {
      const res = await fetch("http://localhost:8000/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          scenario,
          beginner_mode: beginnerMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Session failed");

      setSessionId(data.session_id);
      beginnerModeRef.current = beginnerMode;

      const opening = data.opening as {
        response_spanish?: string;
        response_english?: string;
        pronunciation_guide?: string | null;
        suggestions?: string[];
      } | null;

      if (opening?.response_spanish) {
        setMessages([
          {
            id: uid(),
            role: "assistant",
            spanish: opening.response_spanish,
            english: opening.response_english || "",
            pronunciation: opening.pronunciation_guide ?? null,
            suggestions: Array.isArray(opening.suggestions)
              ? opening.suggestions
              : [],
          },
        ]);
      } else if (data.opening_message) {
        setMessages([
          {
            id: uid(),
            role: "assistant",
            spanish: data.opening_message,
            english: "",
            pronunciation: null,
            suggestions: [],
          },
        ]);
      }

      if (data.opening_audio) playBase64Audio(data.opening_audio);
      connectWebSocket(data.session_id);
      setIsReady(true);
    } catch (e) {
      console.error("[ImmersionAI] Session create failed:", e);
      setConnectionStatus("error");
    } finally {
      setSessionStarting(false);
    }
  }, [beginnerMode, language, scenario, playBase64Audio, connectWebSocket]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const sendRecording = useCallback(async () => {
    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "audio/webm" });
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    setIsProcessing(true);
    const buf = await blob.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(buf).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    ws.send(JSON.stringify({ type: "start" }));
    const CHUNK = 64 * 1024;
    for (let i = 0; i < b64.length; i += CHUNK) {
      ws.send(JSON.stringify({ type: "audio", data: b64.slice(i, i + CHUNK) }));
    }
    ws.send(JSON.stringify({ type: "stop" }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const actx = new AudioContext();
      micAudioCtxRef.current = actx;
      await actx.resume();
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.65;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const createRecorder = () => {
        const stream = micStreamRef.current;
        if (!stream) return;

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        recordedChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          sendRecording();
          setTimeout(() => {
            if (micStreamRef.current?.active) {
              createRecorder();
              mediaRecorderRef.current?.start(250);
              setIsRecording(true);
            }
          }, 500);
        };

        return recorder;
      };

      const recorder = createRecorder();
      recorder?.start(250);
      setIsRecording(true);

      const timeData = new Uint8Array(analyser.fftSize);
      const VAD_MS = 45;
      const SPEECH_FRAMES = 3;
      const SILENCE_FRAMES_END = 14;
      const MIN_SPEECH_FRAMES = 4;
      const SPEECH_MULT = 2.6;
      const SILENCE_MULT = 1.5;
      const NOISE_FLOOR_MIN = 0.004;
      const NOISE_FLOOR_MAX = 0.12;

      let noiseFloor = 0.02;
      let smoothed = 0;
      let consecSpeech = 0;
      let consecQuiet = 0;
      let utteranceSpeechFrames = 0;
      let vadSpeechLatched = false;

      const rmsFromTimeDomain = () => {
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i]! - 128) / 128;
          sum += v * v;
        }
        return Math.sqrt(sum / timeData.length);
      };

      vadIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        if (miloSpeakingRef.current || isProcessingRef.current) {
          consecSpeech = 0;
          consecQuiet = 0;
          vadSpeechLatched = false;
          utteranceSpeechFrames = 0;
          return;
        }

        const raw = rmsFromTimeDomain();
        smoothed = smoothed * 0.35 + raw * 0.65;
        const speechOn = smoothed > noiseFloor * SPEECH_MULT;
        const speechOff = smoothed < noiseFloor * SILENCE_MULT;

        if (speechOn) {
          consecSpeech++;
          consecQuiet = 0;
        } else {
          consecSpeech = 0;
          if (speechOff) consecQuiet++;
          else consecQuiet = Math.max(0, consecQuiet - 1);
        }

        if (!vadSpeechLatched && consecSpeech < SPEECH_FRAMES) {
          noiseFloor =
            noiseFloor * 0.985 + Math.min(smoothed, NOISE_FLOOR_MAX) * 0.015;
          noiseFloor = Math.min(
            Math.max(noiseFloor, NOISE_FLOOR_MIN),
            NOISE_FLOOR_MAX
          );
        }

        if (!vadSpeechLatched && consecSpeech >= SPEECH_FRAMES) {
          vadSpeechLatched = true;
          utteranceSpeechFrames = 0;
        }

        if (vadSpeechLatched && !speechOff) utteranceSpeechFrames++;

        const enoughSpeech =
          vadSpeechLatched && utteranceSpeechFrames >= MIN_SPEECH_FRAMES;
        if (
          enoughSpeech &&
          consecQuiet >= SILENCE_FRAMES_END &&
          mediaRecorderRef.current?.state === "recording"
        ) {
          vadSpeechLatched = false;
          utteranceSpeechFrames = 0;
          consecQuiet = 0;
          consecSpeech = 0;
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, VAD_MS);
    } catch (e) {
      console.error("[ImmersionAI] Mic denied:", e);
    }
  }, [sendRecording]);

  const stopRecording = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close();
      micAudioCtxRef.current = null;
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (micOn && sessionId && connectionStatus === "connected") startRecording();
    else stopRecording();
    return () => stopRecording();
  }, [micOn, sessionId, connectionStatus, startRecording, stopRecording]);

  const sendTextMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || !sessionId) return;
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        setIsProcessing(true);
        ws.send(
          JSON.stringify({
            type: "text",
            message: t,
            beginner_mode: beginnerMode,
          })
        );
        setDraft("");
        return;
      }
      setIsProcessing(true);
      fetch("http://localhost:8000/chat/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: t,
          beginner_mode: beginnerMode,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          const turn = data.turn;
          if (turn) {
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: "user",
                spanish: turn.user_spanish,
                raw: t,
                wasTranslated: turn.user_was_english,
                correction: turn.correction ?? null,
              },
              {
                id: uid(),
                role: "assistant",
                spanish: turn.response_spanish,
                english: turn.response_english || "",
                pronunciation: turn.pronunciation_guide ?? null,
                suggestions: turn.suggestions || [],
              },
            ]);
          }
          if (data.audio) playBase64Audio(data.audio);
          setIsProcessing(false);
        })
        .catch((e) => {
          console.error(e);
          setIsProcessing(false);
        });
      setDraft("");
    },
    [sessionId, beginnerMode, playBase64Audio]
  );

  const handleEndSession = () => {
    stopRecording();
    stopCamera();
    wsRef.current?.close();
    router.push("/dashboard");
  };

  const toggleMic = () => {
    if (!sessionId || connectionStatus !== "connected") return;
    setMicOn((prev) => !prev);
  };

  if (!isReady) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#FAF6F0] text-stone-800">
        <AmbientBackdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-16">
          <div className="mx-auto w-full max-w-lg text-center">
            <div className="relative mx-auto mb-10 flex h-40 w-40 items-center justify-center [perspective:900px]">
              <div className="absolute inset-0 animate-glow-breathe rounded-full bg-amber-400/30 blur-2xl" />
              <div className="relative flex h-32 w-32 animate-float-soft items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-white to-violet-100 shadow-orb ring-[6px] ring-white/90">
                <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-amber-200/50 to-transparent" />
                <span className="relative text-5xl" aria-hidden>
                  ✨
                </span>
              </div>
            </div>

            <GlassPanel className="px-8 py-10 shadow-clay-lg">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600/90">
                ImmersionAI
              </p>
              <h1 className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 bg-clip-text text-3xl font-extrabold leading-tight text-transparent sm:text-4xl">
                Guided {langLabel} with {partner}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                <span className="font-semibold text-stone-800">
                  {scenarioLabel}
                </span>
                — every line has English help, quick replies, and gentle
                corrections. Speak or type; zero Spanish required to start.
              </p>
              <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={beginnerMode}
                  onChange={(e) => setBeginnerMode(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                Beginner mode (English OK + full coaching)
              </label>
              <button
                type="button"
                onClick={handleStartSession}
                disabled={sessionStarting}
                className="mt-6 w-full rounded-full bg-stone-900 py-4 text-base font-semibold text-white shadow-[0_4px_0_rgba(0,0,0,0.35),0_20px_40px_-12px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] enabled:hover:scale-[1.02] disabled:opacity-60 sm:w-auto sm:px-14"
              >
                {sessionStarting ? "Starting…" : "Start learning"}
              </button>
              <p className="mt-5 text-xs text-stone-500">
                Unlocks audio — turn your speakers up.
              </p>
            </GlassPanel>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#E8E4DC] text-stone-900">
      <AmbientBackdrop />

      <header className="relative z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-white/50 bg-white/40 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
            ImmersionAI
          </p>
          <h1 className="truncate text-base font-extrabold sm:text-lg">
            {partner} · {langLabel}
          </h1>
          <p className="truncate text-xs text-stone-500">{scenarioLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-semibold shadow-sm">
            <input
              type="checkbox"
              checked={beginnerMode}
              onChange={(e) => setBeginnerMode(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            Beginner
          </label>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-mono text-stone-600">
            {fmt(seconds)}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-emerald-500"
                : connectionStatus === "connecting"
                ? "animate-pulse bg-amber-400"
                : "bg-rose-500"
            }`}
            title={connectionStatus}
          />
          <button
            type="button"
            onClick={handleEndSession}
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-md"
          >
            End
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {cameraOn && (
          <div className="absolute right-3 top-3 z-30 h-24 w-20 overflow-hidden rounded-2xl border-2 border-white shadow-lg sm:h-28 sm:w-24">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full -scale-x-100 object-cover"
            />
          </div>
        )}

        <div
          ref={conversationRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-32 sm:px-6"
        >
          {connectionStatus === "error" && (
            <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
              Can&apos;t reach the server. Is the API running on port 8000?
            </p>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex flex-col items-end gap-1 pl-8">
                {m.wasTranslated && m.raw && (
                  <p className="max-w-[90%] text-right text-[11px] text-stone-500">
                    You said (English):{" "}
                    <span className="italic text-stone-600">{m.raw}</span>
                  </p>
                )}
                <div className="max-w-[90%] rounded-[1.25rem] rounded-br-md bg-[#007AFF] px-4 py-2.5 text-[15px] leading-snug text-white shadow-md">
                  {m.spanish}
                </div>
                {m.correction &&
                  (m.correction.original || m.correction.corrected) && (
                    <div className="max-w-[90%] rounded-2xl border border-amber-200/80 bg-amber-50/95 px-3 py-2 text-left text-xs text-stone-800 shadow-sm">
                      <p className="font-bold text-amber-800">Coach tip</p>
                      {m.correction.original ? (
                        <p className="mt-1 line-through opacity-70">
                          {m.correction.original}
                        </p>
                      ) : null}
                      <p className="font-medium text-emerald-800">
                        {m.correction.corrected}
                      </p>
                      {m.correction.note ? (
                        <p className="mt-1 text-stone-600">{m.correction.note}</p>
                      ) : null}
                    </div>
                  )}
              </div>
            ) : (
              <div key={m.id} className="flex flex-col items-start gap-1 pr-10">
                <span className="pl-1 text-[11px] font-semibold text-stone-500">
                  {partner}
                </span>
                <div className="max-w-[92%] rounded-[1.25rem] rounded-bl-md border border-stone-200/80 bg-white px-4 py-2.5 text-[15px] leading-snug text-stone-900 shadow-md">
                  {m.spanish}
                </div>
                {m.english ? (
                  <p className="max-w-[92%] pl-1 text-[13px] leading-relaxed text-stone-500">
                    {m.english}
                  </p>
                ) : null}
                {m.pronunciation ? (
                  <p className="max-w-[92%] pl-1 text-[11px] italic text-violet-700/90">
                    {m.pronunciation}
                  </p>
                ) : null}
                {m.suggestions.length > 0 && (
                  <div className="mt-1 flex max-w-[92%] flex-wrap gap-1.5 pl-0.5">
                    {m.suggestions.map((s, i) => (
                      <button
                        key={`${m.id}-s-${i}`}
                        type="button"
                        disabled={isProcessing || !sessionId}
                        onClick={() => sendTextMessage(s)}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-left text-xs font-medium text-amber-950 shadow-sm transition hover:bg-amber-100 disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 pl-1 text-xs text-stone-500">
              <span className="inline-flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:240ms]" />
              </span>
              {partner} is thinking…
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/60 bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-5">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <button
              type="button"
              onClick={toggleMic}
              disabled={connectionStatus !== "connected"}
              title="Microphone"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition ${
                micOn
                  ? "border-rose-400 bg-rose-500 text-white shadow-md"
                  : "border-stone-200 bg-white text-stone-500"
              } disabled:opacity-40`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                {micOn ? (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 3.53-2.61 6.43-6 6.92V21h-2v-3.08c-3.39-.49-6-3.39-6-6.92h2c0 2.76 2.24 5 5 5s5-2.24 5-5h2z" />
                ) : (
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27 6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                )}
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setCameraOn((c) => !c)}
              title="Camera"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition ${
                cameraOn
                  ? "border-violet-300 bg-violet-100 text-violet-800"
                  : "border-stone-200 bg-white text-stone-400"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </button>
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTextMessage(draft);
                  }
                }}
                placeholder={
                  beginnerMode
                    ? "Type in English or Spanish…"
                    : `Type in ${langLabel}…`
                }
                disabled={!sessionId || connectionStatus !== "connected"}
                className="w-full rounded-full border border-stone-200 bg-white py-3 pl-4 pr-12 text-[15px] text-stone-900 shadow-inner outline-none ring-0 placeholder:text-stone-400 focus:border-amber-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => sendTextMessage(draft)}
                disabled={
                  !draft.trim() ||
                  !sessionId ||
                  connectionStatus !== "connected" ||
                  isProcessing
                }
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#007AFF] text-white shadow disabled:opacity-30"
                aria-label="Send"
              >
                <svg
                  className="h-4 w-4 -rotate-90"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
          {micOn && isRecording && (
            <p className="mt-2 text-center text-[11px] font-medium text-rose-600">
              Listening…
            </p>
          )}
          {miloSpeaking && (
            <p className="mt-2 text-center text-[11px] font-medium text-violet-700">
              {partner} is speaking…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <SessionContent />
    </Suspense>
  );
}
