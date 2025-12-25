from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from app.modules.animator.service import AnimatorService

router = APIRouter()

class AnimationRequest(BaseModel):
    image_url: str
    prompt: str

from app.modules.vision.service import VisionService
from app.modules.stitcher.service import StitcherService
from app.modules.voice.service import VoiceService

from fastapi import File, UploadFile
import shutil
import uuid

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Generate unique filename
    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    file_path = f"app/uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return URL (assuming app serves /uploads)
    return {"url": f"/uploads/{filename}", "filename": filename}

@router.post("/animate")
async def animate(request: AnimationRequest):
    # 1. Vision Director: Analyze Setup
    vision = VisionService()
    analysis = await vision.analyze_image(request.image_url)
    visual_prompt = analysis["visual_prompt"]
    script_uzbek = analysis["script_uzbek"]

    # 2. Motion Engine: Generate Video
    animator = AnimatorService()
    # Use the visual prompt from Vision Agent
    raw_video_url = await animator.animate_image(prompt=visual_prompt, image_url=request.image_url)

    # 3. Voice Agent: Generate Speech
    voice = VoiceService()
    voice_path = await voice.generate_voice(script_uzbek)

    # 4. Stitcher: Post-Processing (Mix Video + Voice + BGM)
    stitcher = StitcherService()
    final_video_url = await stitcher.stitch_video(video_url=raw_video_url, voice_path=voice_path)

    return { 
        "status": "completed", 
        "video_url": final_video_url,
        "script": script_uzbek,
        "visual_prompt": visual_prompt,
        "analysis": analysis
    }
