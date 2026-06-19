from contextlib import asynccontextmanager
from base64 import b64encode
from pathlib import Path
from subprocess import CalledProcessError, run
from tempfile import TemporaryDirectory

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from imageio_ffmpeg import get_ffmpeg_exe
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


def extract_video_frames(filepath: Path) -> tuple[TemporaryDirectory, list[Path]]:
    try:
        ffmpeg_path = get_ffmpeg_exe()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="ffmpeg is required for visual analysis. Run pip install -r requirements.txt.",
        ) from exc

    temp_dir = TemporaryDirectory()
    frame_dir = Path(temp_dir.name)
    output_pattern = frame_dir / "frame_%03d.jpg"

    try:
        run(
            [
                ffmpeg_path,
                "-y",
                "-i",
                str(filepath),
                "-vf",
                "fps=1/2,scale='min(768,iw)':-2",
                "-frames:v",
                "5",
                str(output_pattern),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except CalledProcessError as exc:
        temp_dir.cleanup()
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract video frames: {exc.stderr[-500:]}",
        ) from exc

    frames = sorted(frame_dir.glob("frame_*.jpg"))
    if not frames:
        temp_dir.cleanup()
        raise HTTPException(status_code=500, detail="No frames could be extracted from the video.")

    return temp_dir, frames


def encode_frame(frame_path: Path) -> str:
    return b64encode(frame_path.read_bytes()).decode("utf-8")


def analyze_video_frames(filepath: Path) -> dict:
    temp_dir, frames = extract_video_frames(filepath)
    content = [
        {
            "type": "text",
            "text": """
Analyze these sampled frames from a short-form video as a visual content strategist.

Return ONLY valid JSON with exactly these fields:

{
    "visual_summary": "string",
    "visual_hook_score": 0-10,
    "pacing_score": 0-10,
    "production_quality_score": 0-10,
    "on_screen_text": ["string", "string", "string"],
    "visual_strengths": ["string", "string", "string"],
    "visual_weaknesses": ["string", "string", "string"],
    "editing_suggestions": ["string", "string", "string"]
}

Focus on what is visible: subject, setting, framing, lighting, movement, on-screen text,
visual hook, editing energy, and whether the visuals support retention.
Do not return markdown. Return only valid JSON.
            """,
        }
    ]

    try:
        for frame in frames[:5]:
            content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encode_frame(frame)}",
                    },
                }
            )

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": content}],
            response_format={"type": "json_object"},
            max_completion_tokens=1200,
        )

        return json.loads(response.choices[0].message.content)
    finally:
        temp_dir.cleanup()


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
        "visual_summary": video.visual_summary,
        "visual_hook_score": video.visual_hook_score,
        "pacing_score": video.pacing_score,
        "production_quality_score": video.production_quality_score,
        "on_screen_text": video.on_screen_text or [],
        "visual_strengths": video.visual_strengths or [],
        "visual_weaknesses": video.visual_weaknesses or [],
        "editing_suggestions": video.editing_suggestions or [],
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
        visual_analysis = (
            analysis_response(video)
            if video.visual_summary is not None
            else analyze_video_frames(video_path)
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": f"""
Analyze this short-form video as a content strategist and content creator coach.
Use both the transcript and the visual analysis.

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
    "improved_captions": ["string", "string", "string"],
    "visual_summary": "string",
    "visual_hook_score": 0-10,
    "pacing_score": 0-10,
    "production_quality_score": 0-10,
    "on_screen_text": ["string", "string", "string"],
    "visual_strengths": ["string", "string", "string"],
    "visual_weaknesses": ["string", "string", "string"],
    "editing_suggestions": ["string", "string", "string"]
}}

Do not return markdown.
Do not return explanations.
Return only valid JSON.

Transcript:
{transcript}

Visual analysis:
{json.dumps(visual_analysis)}
                """
                }
            ],
            response_format={"type": "json_object"},
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
        video.visual_summary = result["visual_summary"]
        video.visual_hook_score = result["visual_hook_score"]
        video.pacing_score = result["pacing_score"]
        video.production_quality_score = result["production_quality_score"]
        video.on_screen_text = result["on_screen_text"]
        video.visual_strengths = result["visual_strengths"]
        video.visual_weaknesses = result["visual_weaknesses"]
        video.editing_suggestions = result["editing_suggestions"]

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
