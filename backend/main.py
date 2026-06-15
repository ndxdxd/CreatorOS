from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import json
from dotenv import load_dotenv
import os

from database import SessionLocal, Video, create_db

load_dotenv(Path(__file__).parent / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def transcribe_video(filepath: Path) -> str:
    with filepath.open("rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(filepath.name, file.read()),
            model="whisper-large-v3",
            response_format="text",
        )

    return transcription


def analysis_response(video: Video) -> dict:
    return {
        "video_id": video.id,
        "video_filename": video.filename,
        "transcript": video.transcript,
        "topic": video.topic,
        "target_audience": video.target_audience,
        "viral_score": video.viral_score,
        "hook_score": video.hook_score,
        "retention_score": video.retention_score,
        "strengths": video.strengths or [],
        "weaknesses": video.weaknesses or [],
        "improved_hooks": video.improved_hooks or [],
        "improved_captions": video.improved_captions or [],
    }


@app.get("/")
def root():
    return {"message": "Hello from CreatorOS API"}


@app.post("/upload")
async def upload_video(file: UploadFile):
    contents = await file.read()

    filename = Path(file.filename or "upload.mp4").name
    filepath = UPLOAD_DIR / filename

    with filepath.open("wb") as f:
        f.write(contents)

    with SessionLocal() as session:
        video = Video(filename=filename, filepath=str(filepath))
        session.add(video)
        session.commit()
        session.refresh(video)

        video_id = video.id

    return {
        "video_id": video_id,
        "filename": filename,
        "filepath": str(filepath)
    }


@app.post("/analyze/{video_id}")
async def analyze(video_id: int):
    with SessionLocal() as session:
        video = session.get(Video, video_id)
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found.")

        video_path = Path(video.filepath)
        if not video_path.exists():
            raise HTTPException(status_code=404, detail="Uploaded video file not found.")

        transcript = video.transcript or transcribe_video(video_path)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": f"""
Analyze this video transcript as a short-form content strategist and content creator coach.

Return ONLY valid JSON with exactly these fields:

{{
    "topic": "string",
    "target_audience": "string",
    "viral_score": 0-100,
    "hook_score": 0-10,
    "retention_score": 0-10,
    "strengths": ["string", "string", "string"],
    "weaknesses": ["string", "string", "string"],
    "improved_hooks": ["string", "string", "string"],
    "improved_captions": ["string", "string", "string"]
}}

Do not return markdown.
Do not return explanations.
Return only valid JSON.

Transcript:
{transcript}
                """
                }
            ]
        )

        result = json.loads(response.choices[0].message.content)

        video.transcript = transcript
        video.topic = result["topic"]
        video.target_audience = result["target_audience"]
        video.viral_score = result["viral_score"]
        video.hook_score = result["hook_score"]
        video.retention_score = result["retention_score"]
        video.strengths = result["strengths"]
        video.weaknesses = result["weaknesses"]
        video.improved_hooks = result["improved_hooks"]
        video.improved_captions = result["improved_captions"]

        session.commit()
        session.refresh(video)

        return analysis_response(video)


@app.get("/videos")
def list_videos():
    with SessionLocal() as session:
        videos = session.query(Video).order_by(Video.uploaded_at.desc()).all()

        return [
            {
                "video_id": video.id,
                "filename": video.filename,
                "uploaded_at": video.uploaded_at,
                "analyzed": video.transcript is not None,
                "topic": video.topic,
                "viral_score": video.viral_score,
            }
            for video in videos
        ]


@app.get("/videos/{video_id}")
def get_video(video_id: int):
    with SessionLocal() as session:
        video = session.get(Video, video_id)
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found.")

        return analysis_response(video)
