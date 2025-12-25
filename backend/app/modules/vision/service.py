import asyncio
import os
from openai import AsyncOpenAI
from app.core.config import settings

class VisionService:
    def __init__(self):
        # Initialize OpenAI client if key is present, else None
        self.client = None
        if settings.OPENAI_API_KEY:
             self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_image(self, image_url: str) -> dict:
        """
        Analyzes the image to generate a selling script in Uzbek and a visual prompt.
        Returns:
            dict: { "visual_prompt": str, "script_uzbek": str }
        """
        print(f"Vision Agent: Analyzing {image_url}...")
        
        # SIMULATION MODE
        if not self.client:
            print("Running in Vision Simulation Mode (No OpenAI Key found)")
            await asyncio.sleep(1.5)
            return {
                "visual_prompt": "Cinematic slow motion shot of the delicious food item, 8k resolution, steam rising, warm lighting.",
                "script_uzbek": "Ajoyib ta'm, unutilmas lazzat. Atigi 25 ming so'm. Hoziroq buyurtma bering!",
                "summary": "Detected food item."
            }

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "You are a Vision & Scripting Agent. Analyze this image. \n1. Create a detailed visual prompt for a video generator (describe movement, lighting). \n2. Write a short, punchy 5-second selling script in UZBEK language (Latin script). \nReturn format: 'VISUAL_PROMPT: ... \nSCRIPT_UZBEK: ...'"},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                },
                            },
                        ],
                    }
                ],
                max_tokens=300,
            )
            
            content = response.choices[0].message.content
            # Basic parsing logic
            visual_prompt = "Cinematic video of the subject"
            script_uzbek = "Ajoyib mahsulot!"
            
            if "VISUAL_PROMPT:" in content:
                parts = content.split("SCRIPT_UZBEK:")
                if len(parts) > 1:
                    visual_prompt = parts[0].replace("VISUAL_PROMPT:", "").strip()
                    script_uzbek = parts[1].strip()
            
            return {
                "visual_prompt": visual_prompt,
                "script_uzbek": script_uzbek,
                "summary": "AI Analysis Complete"
            }
            
        except Exception as e:
            print(f"Error in VisionService: {e}")
            return {
                "visual_prompt": "Cinematic shot of the product.",
                "script_uzbek": "Sifatli mahsulot. Tavsiya qilamiz.",
                "summary": "Analysis failed (fallback used)"
            }
