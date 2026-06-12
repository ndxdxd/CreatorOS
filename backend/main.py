from fastapi import FastAPI, UploadFile
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

@app.get("/")
def root():
    return {"message": "Hello from CreatorOS API"}

@app.post("/upload")
async def upload_video(file: UploadFile):
    return {"filename": file.filename}

@app.post("/analyze")
async def analyze():
    transcript = """
    I'm 23 years old and realizing adulthood
    is way harder than people told me.
    """

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
    return result