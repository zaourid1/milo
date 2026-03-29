"""Structured immersion turns: Spanish dialogue + English gloss + suggestions + corrections."""

from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from config import (
    LANGUAGE_NAMES,
    OPENAI_API_KEY,
    SCENARIO_PERSONAS,
    ASSISTANT_NAMES,
)

client = OpenAI(api_key=OPENAI_API_KEY)


def _minimal_pronunciation_items(response_spanish: str) -> list[dict[str, str]]:
    """If the model omits items, split reply into 2 chunks for TTS practice."""
    t = (response_spanish or "").strip()
    if not t:
        return []
    parts = [p.strip() for p in t.replace("?", "?|").replace("!", "!|").split("|") if p.strip()]
    if not parts:
        parts = [t]
    out: list[dict[str, str]] = []
    for p in parts[:2]:
        if len(p) < 2:
            continue
        short = p if len(p) <= 48 else p[:45].rsplit(" ", 1)[0] + "…"
        out.append(
            {
                "phrase": short,
                "say_like": "Tap listen — mimic stress & rhythm",
            }
        )
    return out[:2] if out else [{"phrase": t[:40], "say_like": "Tap listen — mimic stress & rhythm"}]


def _parse_pronunciation_items(data: dict[str, Any]) -> list[dict[str, str]]:
    raw = data.get("pronunciation_items")
    if not isinstance(raw, list):
        return []
    out: list[dict[str, str]] = []
    for x in raw[:6]:
        if not isinstance(x, dict):
            continue
        phrase = str(x.get("phrase", "")).strip()
        say_like = str(x.get("say_like", x.get("sayLike", ""))).strip()
        if phrase and say_like:
            out.append({"phrase": phrase, "say_like": say_like})
    return out[:5]


def _assistant_name(language: str) -> str:
    return ASSISTANT_NAMES.get(language, "Milo")


def _json_only_schema_hint(target_lang: str) -> str:
    return f"""
Return ONE JSON object only (no markdown). Keys:
- user_spanish: string — the learner's line in {target_lang} as it belongs in the scene. If beginner_mode is true and they wrote English, translate naturally. If they wrote {target_lang} with mistakes, use the best corrected {target_lang} version for the dialogue.
- user_was_english: boolean — true if their raw message was mostly English.
- response_spanish: string — your in-character reply ONLY in {target_lang}. 1–3 short spoken sentences.
- response_english: string — natural English translation of response_spanish.
- pronunciation_guide: string — one-line summary of how the whole reply flows in English-like sounds (optional extra), not empty if possible.
- pronunciation_items: array of 2 to 5 objects, REQUIRED for learning UX. Each object: "phrase" (exact short substring copied from response_spanish, 1–6 words) and "say_like" (hyphenated pseudo-English syllables; put the STRESSED syllable in CAPS, e.g. "keh-REH-sah" or "oon kah-FEH").
- teaching_tip: string — ONE short English sentence teaching a pattern (grammar, usage, or intonation) from THIS reply — NOT a repeat of response_english.
- suggestions: array of 2 to 4 strings — short natural {target_lang} lines the learner could say next.
- correction: null OR object with "original" (their flawed {target_lang} if any), "corrected" (fixed), "note" (one short English grammar tip). Use when they attempted {target_lang} with clear errors; null if only English was used or text was fine.
- quick_coach_tip: null OR string — SMART INTERRUPTION (elite UX): when their line has a clear, fixable slip (wrong tense, wrong verb form, missing small word), ONE punchy English line you "say" first as coach — e.g. "Quick tip: use *fui* instead of *ir* for past tense 👍". Wrap target-language words in single asterisks for emphasis. Max ~25 words. Must be null if there is nothing worth interrupting for. If non-null, set correction to null (do not duplicate) and keep response_spanish purely in-character in {target_lang} — do not repeat the grammar lecture in Spanish/French/Arabic.
"""


def _parse_turn(raw: str) -> dict[str, Any]:
    data = json.loads(raw)
    suggestions = data.get("suggestions") or []
    if not isinstance(suggestions, list):
        suggestions = []
    suggestions = [str(s).strip() for s in suggestions if str(s).strip()][:4]
    while len(suggestions) < 2:
        suggestions.append("¿Puedes repetir, por favor?")

    corr = data.get("correction")
    if corr is not None and not isinstance(corr, dict):
        corr = None
    if corr:
        corr = {
            "original": str(corr.get("original", "")).strip(),
            "corrected": str(corr.get("corrected", "")).strip(),
            "note": str(corr.get("note", "")).strip(),
        }
        if not corr["corrected"]:
            corr = None

    pg = data.get("pronunciation_guide")
    if pg is not None:
        pg = str(pg).strip() or None
    else:
        pg = None

    items = _parse_pronunciation_items(data)
    tip = str(data.get("teaching_tip", "")).strip() or None

    qct = str(data.get("quick_coach_tip", "")).strip() or None
    if qct:
        if len(qct) > 240:
            qct = qct[:237] + "…"
        corr = None

    return {
        "user_spanish": str(data.get("user_spanish", "")).strip(),
        "user_was_english": bool(data.get("user_was_english", False)),
        "response_spanish": str(data.get("response_spanish", "")).strip(),
        "response_english": str(data.get("response_english", "")).strip(),
        "pronunciation_guide": pg,
        "pronunciation_items": items,
        "teaching_tip": tip,
        "suggestions": suggestions[:4],
        "correction": corr,
        "quick_coach_tip": qct,
    }


def _fallback_turn(user_raw: str) -> dict[str, Any]:
    return {
        "user_spanish": user_raw.strip(),
        "user_was_english": False,
        "response_spanish": "Perdón, un momento — ¿puedes repetir?",
        "response_english": "Sorry, one moment — can you repeat?",
        "pronunciation_guide": "pehr-DOHN, oon moh-MEHN-toh — keh-PEH-dehs rreh-peh-TEER",
        "pronunciation_items": [
            {"phrase": "Perdón", "say_like": "pehr-DOHN"},
            {"phrase": "¿puedes repetir?", "say_like": "keh-PEH-dehs rreh-peh-teer"},
        ],
        "teaching_tip": "Questions in Spanish often start with an upside-down ¿ and rise in pitch at the end.",
        "suggestions": [
            "Sí, claro.",
            "¿Puedes ayudarme?",
            "No entiendo.",
            "Gracias.",
        ],
        "correction": None,
        "quick_coach_tip": None,
    }


def build_immersion_system(language: str, scenario: str, beginner_mode: bool) -> str:
    lang_name = LANGUAGE_NAMES.get(language, language.capitalize())
    persona = SCENARIO_PERSONAS.get(
        scenario, "You are a helpful native conversation partner."
    )
    name = _assistant_name(language)

    bm = (
        "Beginner mode ON: the learner may write or speak English. "
        "Silently interpret English into natural "
        f"{lang_name} in user_spanish. Always respond in {lang_name} only in response_spanish."
        if beginner_mode
        else "Beginner mode OFF: expect the learner to use the target language; still help gently."
    )

    return f"""You are {name}, a warm, patient immersion coach for {lang_name}.

Role in this session: {persona}

{bm}

Always stay in character for the scenario in response_spanish. The quick_coach_tip field is the ONLY place for brief English coach-asides (wrong-tense fixes, etc.); never dump those lessons into response_spanish.

Never break immersion with meta talk in the target language unless the learner is completely stuck — then one short encouraging line in {lang_name} is OK.

You are also a pronunciation coach: pronunciation_items must be filled every turn with real fragments from response_spanish so the learner can hear and mimic. teaching_tip should highlight one learnable pattern.

{_json_only_schema_hint(lang_name)}
"""


def run_immersion_turn(
    *,
    user_raw: str,
    language: str,
    scenario: str,
    history: list[dict[str, str]],
    beginner_mode: bool,
) -> dict[str, Any]:
    """Produce structured turn; updates use user_spanish + response_spanish for chat history."""
    user_raw = (user_raw or "").strip()
    if not user_raw:
        return _fallback_turn("")

    system = build_immersion_system(language, scenario, beginner_mode)
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    messages.extend(history)
    messages.append(
        {
            "role": "user",
            "content": f'Learner message (raw, may be English or {LANGUAGE_NAMES.get(language, language)}): """{user_raw}"""',
        }
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=900,
            temperature=0.65,
        )
        raw = response.choices[0].message.content or "{}"
        data = _parse_turn(raw)
        if not data["user_spanish"]:
            data["user_spanish"] = user_raw
        if not data["response_spanish"]:
            data["response_spanish"] = "¿Podrías decirlo de otra forma?"
        if not data["response_english"]:
            data["response_english"] = data["response_spanish"]
        lang_name = LANGUAGE_NAMES.get(language, language.capitalize())
        if not data.get("pronunciation_items"):
            data["pronunciation_items"] = _minimal_pronunciation_items(
                data["response_spanish"]
            )
        if not data.get("teaching_tip"):
            data["teaching_tip"] = (
                f"In {lang_name}, match the melody you hear — exaggerate vowels slightly when you repeat."
            )
        return data
    except (json.JSONDecodeError, Exception) as e:
        print(f"[immersion] turn error: {e}")
        return _fallback_turn(user_raw)


def get_immersion_opening(
    *,
    language: str,
    scenario: str,
    beginner_mode: bool,
) -> dict[str, Any]:
    """First assistant turn as structured JSON (no user message yet)."""
    lang_name = LANGUAGE_NAMES.get(language, language.capitalize())
    persona = SCENARIO_PERSONAS.get(
        scenario, "You are a helpful native conversation partner."
    )
    name = _assistant_name(language)

    prompt = f"""The learner just joined. No prior messages.

You are {name}. Scenario: {persona}
Target language for your speech: {lang_name}
Beginner mode: {"on — they may know almost nothing; greet simply and invite them in one easy question" if beginner_mode else "off — greet naturally"}.

{_json_only_schema_hint(lang_name)}

For this opening ONLY:
- user_spanish: "" (empty string)
- user_was_english: false
- correction: null
- quick_coach_tip: null
- suggestions: 3–4 very easy {lang_name} phrases they might say next (e.g. greetings, simple requests).
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": build_immersion_system(language, scenario, beginner_mode)},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=700,
            temperature=0.75,
        )
        raw = response.choices[0].message.content or "{}"
        data = _parse_turn(raw)
        data["user_spanish"] = ""
        data["user_was_english"] = False
        data["correction"] = None
        data["quick_coach_tip"] = None
        if not data["response_spanish"]:
            data["response_spanish"] = (
                "¡Hola! Bienvenido. ¿En qué puedo ayudarte?"
                if language == "spanish"
                else f"Hello! Welcome — let's practice {lang_name} together."
            )
        if not data["response_english"]:
            data["response_english"] = data["response_spanish"]
        if not data.get("pronunciation_items"):
            data["pronunciation_items"] = _minimal_pronunciation_items(
                data["response_spanish"]
            )
        if not data.get("teaching_tip"):
            data["teaching_tip"] = (
                "Greetings often use ¿Qué…? to invite the other person to share what they want."
            )
        return data
    except Exception as e:
        print(f"[immersion] opening error: {e}")
        return {
            "user_spanish": "",
            "user_was_english": False,
            "response_spanish": "¡Hola! Bienvenido. ¿Qué te gustaría?",
            "response_english": "Hi! Welcome. What would you like?",
            "pronunciation_guide": "OH-lah — bee-ehn-veh-NEE-doh — keh teh goos-tah-REE-ah",
            "pronunciation_items": [
                {"phrase": "¡Hola!", "say_like": "OH-lah"},
                {"phrase": "¿Qué te gustaría?", "say_like": "keh teh goos-tah-REE-ah"},
            ],
            "teaching_tip": "The rolled 'r' in perro takes practice; in greetings it's often soft or tap-like.",
            "suggestions": ["Hola", "Un café, por favor", "Gracias", "¿Cuánto cuesta?"],
            "correction": None,
            "quick_coach_tip": None,
        }
