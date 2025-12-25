
declare global {
  interface Window {
    // Add FFMPEG global for video stitching
    FFMPEG?: {
      createFFmpeg: (options: any) => any;
    };
  }
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  instruction: string;
}

export interface MarketingMetrics {
  platform: 'TikTok' | 'Instagram' | 'YouTube Shorts';
  followers: string;
  avgViews: string;
  engagementRate: string;
  topDemographic: string;
  retentionDropoff: string; // e.g., "3 seconds"
}

export interface Scene {
  sceneNumber: number;
  script: string;
  prompt: string;
  videoUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface Plan {
  id: string;
  timestamp: number;
  title: string;
  scenes: Scene[];
  agentId?: string;
  marketingData?: MarketingMetrics; // Optional data if Marketer was used
}

export type AppState = 'selecting-agent' | 'idle' | 'planning' | 'review' | 'generating' | 'stitching' | 'finished' | 'error';
