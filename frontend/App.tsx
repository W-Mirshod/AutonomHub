
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, Plan, Scene, Agent, MarketingMetrics } from './types';
import { generateScriptAndPrompts, generateVideoForScene, VideoGenerationConfig } from './services/geminiService';
import { AGENTS, DEMO_METRICS } from './constants';
import StatusDisplay from './components/StatusDisplay';
import LoginPage from './components/LoginPage';
import BillingModal from './components/BillingModal';
import ApiKeySelector from './components/ApiKeySelector';
import { useAuth } from './hooks/useAuth';
import { useWallet } from './hooks/useWallet';
import VideoPlayer from './components/VideoPlayer';
import ConfirmationModal from './components/ConfirmationModal';

const VIDEO_COST = 10; // Cost per video generation request

// ICONS
const LogoIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ChevronLeftIcon: React.FC = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const DirectorIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-8 h-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const MarketerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-8 h-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const StorytellerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-8 h-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const GenerateIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.66669 4.16666L15 9.99999L6.66669 15.8333V4.16666Z" />
    </svg>
);

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const getAgentIcon = (id: string) => {
    switch(id) {
        case 'director': return <DirectorIcon />;
        case 'marketer': return <MarketerIcon />;
        case 'storyteller': return <StorytellerIcon />;
        default: return <DirectorIcon />;
    }
};

// Helper to identify API key-related errors
const isApiKeyError = (e: any): boolean => {
    const errorDetails = e.error || {};
    const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';
    return errorDetails.status === 'NOT_FOUND' || errorDetails.code === 404 || message.includes('api key not valid');
};

// Helper to identify rate limit errors
const isRateLimitError = (e: any): boolean => {
    const errorDetails = e.error || {};
    return errorDetails.status === 'RESOURCE_EXHAUSTED' || errorDetails.code === 429;
};

const getSceneErrorMessage = (e: any, sceneNumber: number): string => {
    if (isApiKeyError(e)) return `API Key Error`;
    if (isRateLimitError(e)) return `Quota Exceeded`;

    const errorDetails = e.error || {};
    if (errorDetails.status === 'INVALID_ARGUMENT' || errorDetails.code === 400) {
        return `Content policy violation`;
    }
    return e.message || 'An unknown error occurred';
};

interface HistoryItem {
    plan: Plan;
    videoUrl?: string;
}

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const { isAuthenticated, login, logout } = useAuth();
  const { balance, charge, addFunds } = useWallet();
  
  const [appState, setAppState] = useState<AppState>('selecting-agent');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  const [userInput, setUserInput] = useState<string>('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrls, setGeneratedVideoUrls] = useState<string[]>([]);
  const [stitchedVideoUrl, setStitchedVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [image, setImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Marketer Specific State
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics>(DEMO_METRICS as MarketingMetrics);

  const isProcessing = appState === 'planning' || appState === 'generating' || appState === 'stitching';

  // Load history from local storage
  useEffect(() => {
      try {
          const storedHistory = localStorage.getItem('autonomhub_history');
          if (storedHistory) {
              setHistory(JSON.parse(storedHistory));
          }
      } catch (e) {
          console.error("Failed to load history", e);
      }
  }, []);

  const saveToHistory = useCallback((plan: Plan, videoUrl?: string) => {
      setHistory(prev => {
          const exists = prev.findIndex(p => p.plan.id === plan.id);
          let newHistory;
          if (exists >= 0) {
              newHistory = [...prev];
              newHistory[exists] = { plan, videoUrl };
          } else {
              newHistory = [{ plan, videoUrl }, ...prev].slice(0, 10); // Keep last 10
          }
          localStorage.setItem('autonomhub_history', JSON.stringify(newHistory));
          return newHistory;
      });
  }, []);

  const removeImage = useCallback(() => {
    if (image) {
        URL.revokeObjectURL(image.previewUrl);
    }
    setImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [image]);

  const handleReset = useCallback(() => {
    // Reset to agent selection
    setAppState('selecting-agent');
    setSelectedAgent(null);
    setUserInput('');
    setPlan(null);
    setError(null);
    setGeneratedVideoUrls([]);
    if (stitchedVideoUrl) {
        URL.revokeObjectURL(stitchedVideoUrl);
    }
    setStitchedVideoUrl(null);
    removeImage();
    setAspectRatio('16:9');
    setShowOptions(false);
  }, [removeImage, stitchedVideoUrl]);

  const handleSelectAgent = (agent: Agent) => {
      setSelectedAgent(agent);
      setAppState('idle');
      // Set default aspect ratio based on agent
      if (agent.id === 'marketer') setAspectRatio('9:16'); // Mobile vertical default for marketers
      else setAspectRatio('16:9');
  };

  const handleBackToAgents = () => {
      setAppState('selecting-agent');
      setSelectedAgent(null);
      setUserInput('');
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
      if (item.plan.agentId) {
          const agent = AGENTS.find(a => a.id === item.plan.agentId);
          if (agent) setSelectedAgent(agent);
      } else {
          setSelectedAgent(AGENTS[0]);
      }

      if (item.videoUrl) {
          setStitchedVideoUrl(item.videoUrl);
          setPlan(item.plan);
          setAppState('finished');
      } else {
          setPlan(item.plan);
          setAppState('review');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        try {
            const base64 = await fileToBase64(file);
            const previewUrl = URL.createObjectURL(file);
            setImage({ file, base64, previewUrl });
        } catch (error) {
            console.error("Error converting file to base64:", error);
            setError("Could not process the uploaded image.");
        }
    }
  };
  
  const parseDurationAndGetSceneCount = (input: string): number => {
      const match = input.match(/(\d+)\s*(-|\s)?(seconds?|sec|s)\b/i);
      if (match && match[1]) {
          const duration = parseInt(match[1], 10);
          const clampedDuration = Math.max(5, Math.min(duration, 30));
          return Math.ceil(clampedDuration / 5);
      }
      return 3; // Default scene count
  };

  // Step 1: Draft the Plan (Free/Cheap)
  const handleDraftPlan = async () => {
    if (!userInput.trim() || isProcessing || !selectedAgent) return;
    setError(null);
    setAppState('planning');
    
    try {
      const numberOfScenes = parseDurationAndGetSceneCount(userInput);
      
      // Pass marketing data only if Marketer agent is selected
      const dataToPass = selectedAgent.id === 'marketer' ? marketingMetrics : undefined;

      const generatedPlan = await generateScriptAndPrompts(
          userInput, 
          !!image, 
          numberOfScenes, 
          selectedAgent,
          dataToPass
      );
      
      if (generatedPlan.scenes.length === 0) {
        throw new Error("The AI failed to generate a plan. Please try rephrasing your idea.");
      }

      const planWithMeta: Plan = {
          ...generatedPlan,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          agentId: selectedAgent.id,
          marketingData: dataToPass
      };

      setPlan(planWithMeta);
      setAppState('review');
      saveToHistory(planWithMeta);

    } catch (e) {
      if (isApiKeyError(e)) {
        setError("API Key Error. Please refresh and select a valid key.");
        setAppState('error');
      } else {
        console.error(e);
        setError((e as Error).message);
        setAppState('error');
      }
    }
  };

  // Step 2: Update Plan during Review
  const updateScene = (index: number, field: 'script' | 'prompt', value: string) => {
      if (!plan) return;
      const newScenes = [...plan.scenes];
      newScenes[index] = { ...newScenes[index], [field]: value };
      setPlan({ ...plan, scenes: newScenes });
  };

  // Step 3: Confirm and Pay
  const handleRequestGeneration = () => {
      if (balance < VIDEO_COST) {
          setError(`Insufficient funds. You need $${VIDEO_COST} to generate a video. Please add funds.`);
          setIsBillingOpen(true);
          return;
      }
      setIsConfirmationOpen(true);
  };

  // Step 4: Start Generation
  const startGeneration = async () => {
    setIsConfirmationOpen(false);
    
    const paymentSuccessful = await charge(VIDEO_COST);
    if(!paymentSuccessful) {
        setError("An issue occurred with the payment. Please try again.");
        return;
    }

    setAppState('generating');
  };


  const runVideoGeneration = useCallback(async () => {
    if (!plan) return;

    const startIndex = plan.scenes.findIndex(s => s.status !== 'completed');
    if (startIndex === -1) {
      setAppState('stitching');
      return;
    }
    
    const urlsSoFar = plan.scenes.slice(0, startIndex).map(s => s.videoUrl).filter((url): url is string => !!url);
    const generatedUrls = [...urlsSoFar];

    for (let i = startIndex; i < plan.scenes.length; i++) {
        const scene = plan.scenes[i];
        
        setPlan(currentPlan => {
            if (!currentPlan) return null;
            const newScenes = currentPlan.scenes.map((s): Scene => s.sceneNumber === scene.sceneNumber ? {...s, status: 'generating'} : s);
            return {...currentPlan, scenes: newScenes};
        });
        
        try {
          const videoConfig: VideoGenerationConfig = {
            prompt: scene.prompt,
            aspectRatio,
            image: (i === 0 && image) ? { base64: image.base64, mimeType: image.file.type } : null,
          };

          const videoUrl = await generateVideoForScene(videoConfig);
          generatedUrls.push(videoUrl);
          setPlan(currentPlan => {
              if (!currentPlan) return null;
              const newScenes = currentPlan.scenes.map((s): Scene => s.sceneNumber === scene.sceneNumber ? {...s, status: 'completed', videoUrl} : s);
              return {...currentPlan, scenes: newScenes};
          });
        } catch (e: any) {
          console.error(`Error generating video for scene ${scene.sceneNumber}:`, e);
          const errorMessage = getSceneErrorMessage(e, scene.sceneNumber);

          setPlan(currentPlan => {
              if (!currentPlan) return null;
              const newScenes = currentPlan.scenes.map((s): Scene => s.sceneNumber === scene.sceneNumber ? {...s, status: 'failed', errorMessage} : s);
              return {...currentPlan, scenes: newScenes};
          });
          
          setError(`Video generation failed on Scene ${scene.sceneNumber}: ${errorMessage}`);
          setAppState('error');
          return;
        }
      }

      setGeneratedVideoUrls(generatedUrls);
      setAppState('stitching');
  }, [plan, aspectRatio, image]);

  const stitchVideos = useCallback(async () => {
    if (!window.FFMPEG) {
        setError("Video stitching engine (FFmpeg) is not ready. Please try refreshing the page.");
        setAppState('error');
        return;
    }
    if (generatedVideoUrls.length === 0) {
        setError("No video clips were successfully generated, so there is nothing to stitch.");
        setAppState('error');
        return;
    }

    setError(null);

    const { createFFmpeg } = window.FFMPEG;
    const ffmpeg = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
    });

    try {
        await ffmpeg.load();
    } catch (err) {
        console.error("FFmpeg core failed to load:", err);
        setError("Failed to initialize the video stitching engine. Please check your network connection and try again.");
        setAppState('error');
        return;
    }
    
    try {
        for (let i = 0; i < generatedVideoUrls.length; i++) {
            const url = generatedVideoUrls[i];
            const fileName = `scene${i}.mp4`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = new Uint8Array(await response.arrayBuffer());
                ffmpeg.FS('writeFile', fileName, data);
            } catch (fetchErr) {
                console.error(`Failed to fetch or write scene ${i + 1}:`, fetchErr);
                throw new Error(`Could not download video clip for Scene ${i + 1}.`);
            }
        }

        const fileList = generatedVideoUrls.map((_, i) => `file 'scene${i}.mp4'`).join('\n');
        ffmpeg.FS('writeFile', 'mylist.txt', fileList);
        await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'mylist.txt', '-c', 'copy', 'output.mp4');
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        
        const finalUrl = URL.createObjectURL(videoBlob);
        setStitchedVideoUrl(finalUrl);
        setAppState('finished');
        
        if (plan) {
            saveToHistory(plan, finalUrl);
        }

    } catch (err) {
        console.error("Error during video stitching process:", err);
        if (err instanceof Error && err.message.startsWith('Could not download')) {
            setError(err.message);
        } else {
            setError("A file processing error occurred during video stitching. One or more clips might be invalid.");
        }
        setAppState('error');
    }
  }, [generatedVideoUrls, plan, saveToHistory]);

  const handleDownload = () => {
    if (!stitchedVideoUrl) return;
    const a = document.createElement('a');
    a.href = stitchedVideoUrl;
    a.download = `${plan?.title?.replace(/ /g, '_') || 'autonomhub_video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  useEffect(() => {
    if (appState === 'generating') {
        runVideoGeneration();
    }
    if (appState === 'stitching') {
        stitchVideos();
    }
  }, [appState, runVideoGeneration, stitchVideos]);

  useEffect(() => {
    return () => {
        if(image?.previewUrl) {
            URL.revokeObjectURL(image.previewUrl);
        }
    }
  }, [image]);

  // --- RENDER LOGIC ---

  if (!hasApiKey) {
      return <ApiKeySelector onKeySelected={() => setHasApiKey(true)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const showAgentSelection = appState === 'selecting-agent';
  const showComposeUI = appState === 'idle' || appState === 'error' || appState === 'planning';
  const showReviewUI = appState === 'review';
  const showFinishedUI = appState === 'finished';

  // DYNAMIC UI ELEMENTS BASED ON AGENT
  const isMarketer = selectedAgent?.id === 'marketer';
  const isStoryteller = selectedAgent?.id === 'storyteller';
  const placeholderText = isMarketer 
      ? "Define your campaign goal (e.g., 'Increase brand awareness for new coffee line')" 
      : isStoryteller 
      ? "Describe the plot or opening scene (e.g., 'A detective walks into a rainy cyberpunk bar')" 
      : "Describe your vision, and the agent will draft a plan.";

  return (
    <div className="min-h-screen font-sans text-zinc-100 flex flex-col">
       <BillingModal 
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        balance={balance}
        onAddFunds={() => addFunds(20)}
      />
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={startGeneration}
        cost={VIDEO_COST}
      />
      
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={handleReset}>
                <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg mr-3">
                   <LogoIcon />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white">AutonomHub</h1>
              </div>
              <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm font-medium text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      ${balance.toFixed(2)}
                  </div>
                  <button onClick={() => setIsBillingOpen(true)} className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors font-medium">Billing</button>
                  <button onClick={logout} className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors font-medium">Log Out</button>
              </div>
          </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl flex flex-col">
        
        {/* AGENT SELECTION */}
        {showAgentSelection && (
            <div className="flex flex-col items-center justify-center flex-grow animate-fade-in">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-3">Choose Your Agent</h2>
                    <p className="text-zinc-400 max-w-lg mx-auto">Select an AI persona to direct your video generation. Each agent specializes in a different visual and narrative style.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    {AGENTS.map((agent) => (
                        <button
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent as any)}
                            className="group relative bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-8 transition-all duration-300 text-left flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl"
                        >
                            <div className="mb-6 p-4 bg-zinc-950 rounded-xl inline-block text-zinc-100 group-hover:text-white group-hover:bg-zinc-900 transition-colors border border-zinc-800">
                                {getAgentIcon(agent.id)}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{agent.name}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">{agent.description}</p>
                            <div className="mt-auto pt-6 flex items-center text-sm font-semibold text-zinc-500 group-hover:text-white transition-colors">
                                Select Agent <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </div>
                        </button>
                    ))}
                </div>

                 {/* HISTORY SECTION - Only show on agent selection screen */}
                {history.length > 0 && (
                    <div className="w-full max-w-5xl mt-20 pt-10 border-t border-zinc-800/50">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6">Recent Projects</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map((item) => (
                                <div 
                                    key={item.plan.id} 
                                    onClick={() => handleLoadHistoryItem(item)}
                                    className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-1.5 bg-zinc-950 rounded-md text-zinc-400">
                                            {/* Simplified icon rendering for history */}
                                             <div className="w-4 h-4">
                                                 {item.plan.agentId === 'marketer' ? <MarketerIcon className="w-full h-full" /> : item.plan.agentId === 'storyteller' ? <StorytellerIcon className="w-full h-full" /> : <DirectorIcon className="w-full h-full" />}
                                             </div>
                                        </div>
                                        {item.videoUrl ? (
                                            <span className="text-[10px] font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded-full border border-green-900/30">Ready</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-900/20 px-2 py-1 rounded-full border border-amber-900/30">Draft</span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-zinc-200 truncate pr-2 group-hover:text-white">{item.plan.title}</h4>
                                    <p className="text-xs text-zinc-500 mt-1">{new Date(item.plan.timestamp).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* COMPOSE SECTION */}
        {showComposeUI && selectedAgent && (
            <div className="w-full max-w-3xl mx-auto animate-slide-up">
                <button onClick={handleBackToAgents} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeftIcon />
                    <span className="ml-1">Back to Agents</span>
                </button>

                <div className="bg-zinc-900 rounded-2xl p-1 shadow-2xl border border-zinc-800">
                    <div className="bg-zinc-950/50 rounded-xl p-6 sm:p-8">
                        <div className="flex items-center mb-6">
                            <div className="p-3 bg-zinc-800/50 rounded-xl text-white border border-zinc-700/50 mr-4">
                                {getAgentIcon(selectedAgent.id)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">New Project with {selectedAgent.name}</h2>
                                <p className="text-sm text-zinc-400">{isMarketer ? "Analysis Dashboard Active" : "Narrative Mode Active"}</p>
                            </div>
                        </div>

                        {/* MARKETING DATA DASHBOARD */}
                        {isMarketer && (
                            <div className="mb-6 p-4 rounded-lg border border-zinc-800 bg-zinc-900/40 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2 md:col-span-4 mb-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Live Profile Analysis: @CurrentUser</span>
                                    <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">Updated 2m ago</span>
                                </div>
                                <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                                    <div className="text-zinc-500 text-[10px] uppercase">Platform</div>
                                    <div className="text-lg font-bold text-white">{marketingMetrics.platform}</div>
                                </div>
                                <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                                    <div className="text-zinc-500 text-[10px] uppercase">Engagement</div>
                                    <div className="text-lg font-bold text-green-400">{marketingMetrics.engagementRate}</div>
                                </div>
                                <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                                    <div className="text-zinc-500 text-[10px] uppercase">Demographic</div>
                                    <div className="text-lg font-bold text-white">{marketingMetrics.topDemographic}</div>
                                </div>
                                <div className="p-3 bg-zinc-950 rounded border border-zinc-800 border-l-red-500/50 border-l-2">
                                    <div className="text-zinc-500 text-[10px] uppercase">Retention Drop</div>
                                    <div className="text-lg font-bold text-red-400">{marketingMetrics.retentionDropoff}</div>
                                </div>
                                <div className="col-span-2 md:col-span-4 text-xs text-zinc-500 italic mt-2">
                                    * The Marketer agent will optimize your video to fix the {marketingMetrics.retentionDropoff} dropoff point for {marketingMetrics.topDemographic}.
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <textarea
                                id="idea-input"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder={placeholderText}
                                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-zinc-600 focus:outline-none transition-all text-white resize-none placeholder:text-zinc-600 text-lg min-h-[120px]"
                                rows={3}
                                disabled={isProcessing}
                            />
                            {isStoryteller && (
                                <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 text-[10px] font-bold bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 uppercase">Script Mode</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between">
                            <button 
                                onClick={() => setShowOptions(!showOptions)}
                                className="text-sm font-medium text-zinc-400 hover:text-white flex items-center transition-colors"
                            >
                                {showOptions ? 'Hide Settings' : 'Advanced Settings'}
                            </button>
                            <button
                                onClick={handleDraftPlan}
                                disabled={isProcessing || !userInput.trim()}
                                className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
                            >
                                {appState === 'planning' ? (
                                    <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>Analyzing...</>
                                ) : (
                                    isMarketer ? 'Generate Campaign' : 'Draft Screenplay'
                                )}
                            </button>
                        </div>
                        
                        {showOptions && (
                            <div className="mt-6 border-t border-zinc-800 pt-6 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Aspect Ratio</label>
                                        <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                                            {([['16:9', 'Landscape'], ['9:16', 'Portrait']] as const).map(([ratio, label]) => (
                                                <button key={ratio} onClick={() => setAspectRatio(ratio)} disabled={isProcessing} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${aspectRatio === ratio ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Reference Image</label>
                                        {image ? (
                                            <div className="relative group rounded-lg overflow-hidden border border-zinc-700">
                                                <img src={image.previewUrl} alt="Preview" className="w-full h-20 object-cover" />
                                                <button onClick={removeImage} disabled={isProcessing} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <CloseIcon />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input type="file" accept="image/*" id="imageUpload" ref={fileInputRef} onChange={handleImageChange} className="hidden" disabled={isProcessing} />
                                                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full h-20 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all flex flex-col items-center justify-center">
                                                    <UploadIcon />
                                                    <span className="text-[10px] mt-1">Upload Reference</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* REVIEW SECTION */}
        {showReviewUI && plan && (
            <div className="w-full max-w-5xl mx-auto animate-slide-up">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase tracking-wide">Draft Review</span>
                             {plan.agentId === 'marketer' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/30 text-blue-400 border border-blue-800/50 uppercase tracking-wide">Optimized for {plan.marketingData?.platform}</span>}
                        </div>
                        <h2 className="text-3xl font-bold text-white">{plan.title}</h2>
                    </div>
                    <div className="flex space-x-3 mt-4 md:mt-0">
                         <button onClick={handleReset} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">Discard</button>
                         <button 
                            onClick={handleRequestGeneration}
                            className="px-6 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-all shadow-lg shadow-white/10 flex items-center"
                         >
                            <GenerateIcon />
                            <span className="ml-2">Render Video (${VIDEO_COST})</span>
                         </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {plan.scenes.map((scene, idx) => (
                            <div key={scene.sceneNumber} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 group focus-within:border-zinc-600 transition-colors">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-bold text-sm bg-zinc-950 px-3 py-1 rounded-md border border-zinc-800">Scene {scene.sceneNumber}</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-wider">Action Script</label>
                                        <textarea 
                                            value={scene.script}
                                            onChange={(e) => updateScene(idx, 'script', e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:border-white/40 focus:outline-none min-h-[80px] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-wider">AI Visual Prompt</label>
                                        <textarea 
                                            value={scene.prompt}
                                            onChange={(e) => updateScene(idx, 'prompt', e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-400 focus:border-white/40 focus:outline-none min-h-[80px] font-mono text-xs transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Preview / Status Panel */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Project Status</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                You are currently in <strong>Review Mode</strong>. The scripts on the left have been generated by <strong>{AGENTS.find(a => a.id === plan.agentId)?.name || 'AI'}</strong>. You can edit them to refine the final video.
                            </p>
                            <div className="border-t border-zinc-800 pt-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-500">Estimated Duration</span>
                                    <span className="text-white">{plan.scenes.length * 5}s</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-500">Model</span>
                                    <span className="text-white">Veo 3.1</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Est. Cost</span>
                                    <span className="text-white">${VIDEO_COST}.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <StatusDisplay state={appState} plan={plan} error={error} />
        
        {showFinishedUI && stitchedVideoUrl && (
          <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden animate-fade-in">
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-white">{plan?.title}</h2>
                     <button onClick={handleReset} className="text-sm text-zinc-400 hover:text-white">Close Project</button>
                </div>
                <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
                     <VideoPlayer src={stitchedVideoUrl} title={plan?.title} />
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8 justify-center">
                    <button
                        onClick={handleDownload}
                        className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center"
                    >
                        Download MP4
                    </button>
                    <button 
                        onClick={handleReset}
                        className="px-6 py-3 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                        Create New Project
                    </button>
                </div>
            </div>
          </div>
        )}

        {(appState === 'error' && plan && !showReviewUI) && (
             <div className="text-center mt-8">
                <button 
                    onClick={() => setAppState('review')} 
                    className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                >
                    Back to Review
                </button>
                <button 
                    onClick={handleReset}
                    className="ml-4 px-6 py-2 text-zinc-400 hover:text-white font-semibold"
                >
                    Start Over
                </button>
            </div>
        )}
        
      </main>
    </div>
  );
};

export default App;
