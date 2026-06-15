# CreatorOS

CreatorOS is an AI-powered creator analytics platform that helps content creators evaluate and improve short-form videos before publishing. Users can upload a video, automatically generate a transcript, and receive AI-driven feedback on content quality, audience targeting, hook effectiveness, retention potential, and overall viral potential.

The goal of CreatorOS is to act as an intelligent content coach, helping creators optimize videos through actionable recommendations rather than relying solely on trial and error.

---

## Features

* Upload short-form video content
* Automatic speech-to-text transcription using Groq Whisper
* AI-powered content analysis using Llama 3.3 70B
* Viral potential scoring
* Hook effectiveness evaluation
* Audience identification
* Retention analysis
* AI-generated hook improvements
* AI-generated caption recommendations
* Full-stack architecture with Next.js and FastAPI

---

## Demo Workflow

1. User uploads a video
2. Backend stores the uploaded file
3. Groq Whisper generates a transcript
4. Transcript is analyzed by Llama 3.3 70B
5. CreatorOS generates:

   * Topic classification
   * Target audience identification
   * Viral potential score
   * Hook score
   * Retention score
   * Content strengths
   * Content weaknesses
   * Improved hook suggestions
   * Improved caption suggestions

---

## Architecture

```text
Frontend (Next.js)
        │
        ▼
Backend API (FastAPI)
        │
        ├── Video Upload Processing
        ├── PostgreSQL Video Records
        ├── Groq Whisper Transcription
        └── Llama 3.3 Analysis
                │
                ▼
         Structured JSON Results
```

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* FastAPI
* Python
* Pydantic
* PostgreSQL
* SQLAlchemy

### AI & Machine Learning

* Groq API
* Whisper Large V3
* Llama 3.3 70B Versatile

### Development Tools

* Git
* GitHub
* REST APIs

---

## Project Structure

```text
CreatorOS
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── uploads/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/creatoros.git
cd creatoros
```

### Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt
```

Create the local PostgreSQL database:

```bash
createdb creatoros
```

Create a `.env` file:

```env
GROQ_API_KEY=your_api_key_here
DATABASE_URL=postgresql+psycopg://localhost:5432/creatoros
```

Run FastAPI:

```bash
uvicorn main:app --reload
```

Backend will run on:

```text
http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend will run on:

```text
http://localhost:3000
```

---

## Future Enhancements

### Planned Features

* User authentication
* Historical video analytics
* Dashboard for creator insights
* Vector database with pgvector
* Retrieval-Augmented Generation (RAG)
* Personalized content recommendations
* AI agent workflows for content strategy
* Visual frame analysis
* Trend detection
* Cloud deployment with AWS
* Docker containerization
* CI/CD with GitHub Actions

---

## Motivation

Many creators struggle to understand why certain videos perform well while others fail to gain traction. CreatorOS aims to bridge that gap by providing creators with actionable, AI-generated feedback before publishing content.

Rather than attempting to guarantee virality, CreatorOS focuses on identifying strengths, weaknesses, and optimization opportunities that can improve audience engagement and retention.

---

## Author

Andy Minh Truong

Recent Graduate from UC San Diego

Interested in Software Engineering, AI Engineering, Machine Learning, and Full-Stack Development.
