"""AI conversation engine using OpenAI GPT-4o."""

from openai import OpenAI
from config import OPENAI_API_KEY, SCENARIO_PERSONAS, LANGUAGE_NAMES

client = OpenAI(api_key=OPENAI_API_KEY)


def build_system_prompt(language: str, scenario: str) -> str:
    """Build the system prompt for Milo based on language and scenario."""
    persona = SCENARIO_PERSONAS.get(scenario, "You are a helpful conversation partner.")
    lang_name = LANGUAGE_NAMES.get(language, language.capitalize())

    return f"""You are Milo, a friendly and encouraging language tutor.

Current role: {persona}

You are helping a learner practice {lang_name} through an immersive voice conversation.

Rules:
- Stay fully in character for your role
- Respond ONLY in {lang_name} (this is a voice conversation, so be natural and spoken)
- If the learner makes a grammar or vocabulary mistake, gently correct it with a brief note (you may use English for the correction only)
- Suggest more natural or idiomatic phrasing when appropriate
- Keep responses short and conversational — 1 to 3 sentences max, since this is spoken dialogue
- Be encouraging, patient, and warm
- Ask follow-up questions to keep the conversation flowing
- If the learner seems stuck, offer a gentle hint or rephrase your question more simply
- Adapt your complexity to the learner's apparent level"""


def get_ai_response(
    user_text: str,
    language: str,
    scenario: str,
    history: list[dict],
) -> str:
    """Generate Milo's response given the conversation context.

    Args:
        user_text: What the user just said (transcribed).
        language: Target language key.
        scenario: Scenario key.
        history: List of prior messages [{"role": ..., "content": ...}].

    Returns:
        Milo's text response.
    """
    system_prompt = build_system_prompt(language, scenario)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_text})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=300,
        temperature=0.8,
    )

    return response.choices[0].message.content
