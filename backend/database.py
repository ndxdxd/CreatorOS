from datetime import datetime, timezone
from os import getenv
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import DateTime, Integer, String, Text, create_engine, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = getenv(
    "DATABASE_URL",
    "postgresql+psycopg://localhost:5432/creatoros",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    transcript: Mapped[Optional[str]] = mapped_column(Text)
    topic: Mapped[Optional[str]] = mapped_column(Text)
    target_audience: Mapped[Optional[str]] = mapped_column(Text)
    viral_score: Mapped[Optional[int]] = mapped_column(Integer)
    hook_score: Mapped[Optional[int]] = mapped_column(Integer)
    retention_score: Mapped[Optional[int]] = mapped_column(Integer)
    strengths: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    weaknesses: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    improved_hooks: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    improved_captions: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    visual_summary: Mapped[Optional[str]] = mapped_column(Text)
    visual_hook_score: Mapped[Optional[int]] = mapped_column(Integer)
    pacing_score: Mapped[Optional[int]] = mapped_column(Integer)
    production_quality_score: Mapped[Optional[int]] = mapped_column(Integer)
    on_screen_text: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    visual_strengths: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    visual_weaknesses: Mapped[Optional[list[str]]] = mapped_column(JSONB)
    editing_suggestions: Mapped[Optional[list[str]]] = mapped_column(JSONB)


def create_db() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS visual_summary TEXT"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS visual_hook_score INTEGER"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS pacing_score INTEGER"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS production_quality_score INTEGER"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS on_screen_text JSONB"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS visual_strengths JSONB"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS visual_weaknesses JSONB"))
        connection.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS editing_suggestions JSONB"))
