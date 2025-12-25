
export const VEO_MODEL = 'veo-3.1-fast-generate-preview';
export const SCRIPT_MODEL = 'gemini-2.5-pro';

export const LOADING_MESSAGES = [
  "Reticulating splines...",
  "Warming up the quantum video synthesizer...",
  "Teaching pixels to dance...",
  "Compositing dreams into reality...",
  "Adjusting the cinematic lens...",
  "Rendering one frame at a time...",
  "Polishing the final cut...",
  "Consulting the muse of cinematography...",
];

export const AGENTS = [
  {
    id: 'director',
    name: 'The Director',
    description: 'Balanced visual storytelling with a focus on cinematography and lighting.',
    instruction: 'Act as a cinematographic director. Focus on camera angles, depth of field, lighting (chiaroscuro, golden hour), and visual composition. Ensure scenes flow like a movie.',
  },
  {
    id: 'marketer',
    name: 'The Marketer',
    description: 'Data-driven video creation optimized for engagement, CTR, and viral hooks.',
    instruction: 'Act as a digital marketing expert. You have access to social media metrics. create scripts that are "scroll-stopping". Prioritize high-energy hooks in the first 3 seconds. Use the provided metrics to tailor the content.',
  },
  {
    id: 'storyteller',
    name: 'The Storyteller',
    description: 'Narrative-first approach focusing on scripts, dialogue, and emotional arcs.',
    instruction: 'Act as a screenwriter and novelist. Focus heavily on the script, dialogue (if any), and the narrative arc. Ensure there is a clear Beginning, Middle, and End. Focus on character emotion.',
  }
];

export const DEMO_METRICS = {
  platform: 'TikTok',
  followers: '12.4K',
  avgViews: '4.2K',
  engagementRate: '8.5%',
  topDemographic: 'Gen Z (18-24)',
  retentionDropoff: '3s',
};
