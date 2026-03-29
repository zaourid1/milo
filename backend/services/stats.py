"""Aggregate learning stats from persisted practice sessions."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from database import PracticeSession


def compute_day_streak(practice_dates: set[date]) -> int:
    """Consecutive calendar days with at least one session, anchored to today or yesterday."""
    if not practice_dates:
        return 0
    today = date.today()
    if today in practice_dates:
        cursor = today
    elif (today - timedelta(days=1)) in practice_dates:
        cursor = today - timedelta(days=1)
    else:
        return 0
    streak = 0
    while cursor in practice_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def aggregate_user_stats(db: Session, user_id: int) -> dict:
    rows = (
        db.query(PracticeSession)
        .filter(PracticeSession.user_id == user_id)
        .all()
    )
    total_seconds = sum(r.duration_seconds or 0 for r in rows)
    session_count = len(rows)
    total_words = sum(r.words_practiced or 0 for r in rows)
    dates: set[date] = set()
    for r in rows:
        if r.created_at:
            dates.add(r.created_at.date())
    streak = compute_day_streak(dates)
    hours = round(total_seconds / 3600, 1)
    return {
        "hours_learned": hours,
        "session_count": session_count,
        "day_streak": streak,
        "words_learned": total_words,
    }
