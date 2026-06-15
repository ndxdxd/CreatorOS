from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import json
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

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


def latest_uploaded_file() -> Optional[Path]:
    files = [path for path in UPLOAD_DIR.iterdir() if path.is_file()]
    if not files:
        return None
    return max(files, key=lambda path: path.stat().st_mtime)


def transcribe_video(filepath: Path) -> str:
    with filepath.open("rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(filepath.name, file.read()),
            model="whisper-large-v3",
            response_format="text",
        )

    return transcription


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

    return {
        "filename": filename,
        "filepath": str(filepath)
    }

@app.post("/analyze")
async def analyze():
    video_path = latest_uploaded_file()
    if video_path is None:
        raise HTTPException(status_code=400, detail="Upload a video before analyzing.")

    transcript = transcribe_video(video_path)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": f"""
                    Analyze this video transcript and return JSON with exactly these fields:
                    1. topic
                    2. audience
                    3. hook_strength (1-10)
                    4. hook_ideas (list of 3)
                    5. caption

                    Return only valid JSON, no markdown, no backticks.

                    Transcript: {transcript}
                """
            }
        ]
    )

    result = json.loads(response.choices[0].message.content)
    result["transcript"] = transcript
    result["video_filename"] = video_path.name
    return result
