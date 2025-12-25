# AutonomHub

AI-powered video animation platform that transforms images into animated videos with voice narration.

## Quick Start

1. Set environment variables in `.env`:
   ```bash
   KLING_API_KEY=your_key
   RUNWAY_API_KEY=your_key
   OPENAI_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

3. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:7060

## Architecture

- **Backend**: FastAPI (Python) - handles image upload, animation, voice generation, and video stitching
- **Frontend**: React + TypeScript - web interface

## API Endpoints

- `POST /api/v1/upload` - Upload image
- `POST /api/v1/animate` - Generate animated video from image and prompt
- `GET /health` - Health check

## Development

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
