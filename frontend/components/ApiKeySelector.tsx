import React, { useEffect, useState } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  errorMessage?: string | null;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, errorMessage }) => {
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (process.env.API_KEY || process.env.GEMINI_API_KEY) {
        onKeySelected();
        return;
      }
      
      if (errorMessage) {
        setShowSelector(true);
        return;
      }
      
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        onKeySelected();
      } else {
        setShowSelector(true);
      }
    };
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setShowSelector(false);
      onKeySelected();
    }
  };

  if (!showSelector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <div className="text-sm animate-pulse">Connecting to Google AI...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-zinc-950">
      <div className="bg-zinc-900 p-10 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-800">
        <h2 className="text-2xl font-bold mb-4 text-white">API Access Required</h2>
        <p className="mb-8 text-zinc-400 text-sm leading-relaxed">
          {errorMessage ? (
            <span className="text-red-400 font-semibold">{errorMessage}</span>
          ) : (
            'To use the high-fidelity Veo generation models, you must authorize access with your Google AI API key. This key is used directly in your browser session.'
          )}
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
        >
          {errorMessage ? 'Select New API Key' : 'Connect API Key'}
        </button>
        <p className="mt-6 text-xs text-zinc-600">
          See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:underline">Google AI pricing</a> for details.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySelector;