import React, { useState, useEffect } from 'react';
import { AppState, Plan } from '../types';
import { LOADING_MESSAGES } from '../constants';

interface StatusDisplayProps {
  state: AppState;
  plan: Plan | null;
  error: string | null;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.103 3.103-1.537-1.537a.75.75 0 0 0-1.06 1.06l2.067 2.067a.75.75 0 0 0 1.06 0l3.633-3.633Z" clipRule="evenodd" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-5 h-5 animate-spin"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const FailureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 0 1 1.06 0L12 9.94l.72-.72a.75.75 0 1 1 1.06 1.06L13.06 12l.72.72a.75.75 0 1 1-1.06 1.06L12 13.06l-.72.72a.75.75 0 0 1-1.06-1.06L10.94 12l-.72-.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );

const StatusItem: React.FC<{ children: React.ReactNode; status: 'pending' | 'active' | 'completed' | 'failed' }> = ({ children, status }) => {
  const baseClasses = "flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 border";
  const statusClasses = {
    pending: "border-transparent text-zinc-600 bg-transparent",
    active: "border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm",
    completed: "border-green-900/20 bg-green-900/5 text-green-600",
    failed: "border-red-900/20 bg-red-900/5 text-red-500",
  };

  return (
    <div className={`${baseClasses} ${statusClasses[status]}`}>
      <div className="flex-shrink-0 pt-1">
        {status === 'completed' && <CheckIcon />}
        {status === 'active' && <SpinnerIcon />}
        {status === 'failed' && <FailureIcon />}
        {status === 'pending' && <div className="w-5 h-5 border-2 border-zinc-800 rounded-full"></div>}
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
};


const StatusDisplay: React.FC<StatusDisplayProps> = ({ state, plan, error }) => {
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (state === 'generating') {
      const interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
          return LOADING_MESSAGES[nextIndex];
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [state]);
  
  if (state === 'selecting-agent' || state === 'idle' || state === 'planning' || state === 'review') return null;

  const isGenerating = state === 'generating';
  const isStitching = state === 'stitching';
  const isFinished = state === 'finished';
  const postPlanning = isGenerating || isStitching || isFinished;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-lg font-bold text-white flex items-center">
            <span className="mr-3">Production Log</span>
            {isGenerating && <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse uppercase tracking-wider">Live</span>}
        </h2>
      </div>
      
      <div className="p-6 space-y-2">
        <StatusItem status={'completed'}>
            <p className="font-semibold text-sm">Plan Formulation</p>
            <p className="text-xs opacity-70">Script and prompts approved.</p>
        </StatusItem>

        {plan?.scenes.map((scene) => {
          const isSceneActive = isGenerating && scene.status === 'generating';
          const isSceneCompleted = scene.status === 'completed';
          const isSceneFailed = scene.status === 'failed';

          let status: 'pending' | 'active' | 'completed' | 'failed' = 'pending';
          if (isSceneActive) status = 'active';
          else if (isSceneCompleted) status = 'completed';
          else if (isSceneFailed) status = 'failed';
          else if (postPlanning && scene.status === 'pending') status = 'pending';

          return (
            <StatusItem key={scene.sceneNumber} status={status}>
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">Scene {scene.sceneNumber}: Video Generation</p>
                    {status === 'completed' && <span className="text-[10px] font-bold opacity-70">DONE</span>}
                </div>
                <p className="text-xs opacity-60 line-clamp-1 italic mt-0.5">"{scene.script}"</p>
                {isSceneActive && (
                    <div className="mt-3">
                        <p className="text-xs text-zinc-400 mb-2">{loadingMessage}</p>
                        <div className="w-full bg-zinc-800 rounded-full h-1">
                            <div className="bg-white h-1 rounded-full animate-progress"></div>
                        </div>
                    </div>
                )}
                {isSceneFailed && scene.errorMessage && (
                    <p className="text-xs mt-1 font-semibold">
                        Error: {scene.errorMessage}
                    </p>
                )}
            </StatusItem>
          )
        })}

        <StatusItem status={isFinished ? 'completed' : isStitching ? 'active' : 'pending'}>
            <p className="font-semibold text-sm">Final Assembly</p>
            {isStitching && <p className="text-xs text-zinc-400">Stitching video clips together with FFmpeg...</p>}
            {isFinished && <p className="text-xs opacity-70">Video sequence ready.</p>}
        </StatusItem>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border-t border-red-900/30 text-red-200 animate-shake">
          <div className="flex items-center mb-1">
             <FailureIcon className="w-4 h-4 mr-2" />
             <p className="font-bold text-sm">Production Halted</p>
          </div>
          <p className="text-xs opacity-80">{error}</p>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;