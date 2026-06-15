from datetime import datetime, timezone
from os import getenv
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import DateTime, Integer, String, Text, create_engine
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


def create_db() -> None:
    Base.metadata.create_all(bind=engine)
