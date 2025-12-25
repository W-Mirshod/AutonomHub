import asyncio

class AnimatorService:
    async def animate_image(self, prompt: str, image_url: str) -> str:
        """
        Simulates an API call to a video provider (Veo 3).
        """
        print(f"Generating video for: {image_url}...")
        
        # Simulate generation time
        await asyncio.sleep(2)
        
        # Return dummy video URL
        return "https://www.w3schools.com/html/mov_bbb.mp4"
