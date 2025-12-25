import React, { useState } from 'react';
import { Upload, Film, Mic, Sparkles, AlertCircle, Download, CheckCircle2 } from 'lucide-react';

type Step = 'idle' | 'analyzing' | 'animating' | 'voicing' | 'stitching' | 'completed';

interface AnalysisResult {
  script_uzbek: string;
  visual_prompt: string;
  summary: string;
}

function App() {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file)); // Preview immediately
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && !selectedFile) return;

    setStep('analyzing');
    setError(null);
    setAnalysis(null);
    setResultVideo(null);

    let finalImageUrl = imageUrl;

    try {
      // 1. Upload if file selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url; // Use the server path
      }

      // Simulate progress for UX since backend is one big await for now
      // In a real Celery setup, we'd poll for status
      const progressTimer = setInterval(() => {
        setStep(prev => {
          if (prev === 'analyzing') return 'animating';
          if (prev === 'animating') return 'voicing';
          if (prev === 'voicing') return 'stitching';
          return prev;
        });
      }, 2500);

      const response = await fetch('/api/v1/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: finalImageUrl, prompt: "Auto-detect" }),
      });

      clearInterval(progressTimer);

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setResultVideo(data.video_url);
      setAnalysis({
        script_uzbek: data.script,
        visual_prompt: data.visual_prompt,
        summary: data.analysis?.summary || "Analysis complete"
      });
      setStep('completed');

    } catch (err) {
      setError('Something went wrong. Please try again.');
      setStep('idle');
    }
  };

  const steps = [
    { id: 'analyzing', icon: Sparkles, label: 'Vision Agent: Analyzing Context' },
    { id: 'animating', icon: Film, label: 'Motion Engine: Generating Video' },
    { id: 'voicing', icon: Mic, label: 'Voice Agent: Recording Uzbek VO' },
    { id: 'stitching', icon: Upload, label: 'Stitcher: Mixing Audio & Video' },
  ];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center p-8 font-sans selection:bg-primary selection:text-white">

      {/* Header */}
      <header className="mb-12 text-center animate-fade-in-down">
        <h1 className="text-5xl font-bold mb-2 tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          AutonomHub
        </h1>
        <p className="text-primary font-medium tracking-wide uppercase text-sm">
          Autonomous AI Video Agent
        </p>
      </header>

      <main className="w-full max-w-2xl">

        {/* Input Section */}
        <div className="bg-surface border border-gray-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm mb-8 transition-all duration-500 hover:border-primary/50 group">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">Target Image (URL or Upload)</label>
              <div className="relative">
                <input
                  type="url"
                  value={selectedFile ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setSelectedFile(null); // Clear file if typing URL
                  }}
                  placeholder={selectedFile ? `Selected: ${selectedFile.name}` : "https://..."}
                  disabled={!!selectedFile}
                  className={`w-full bg-black/50 border border-gray-700 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg placeholder-gray-600 group-hover:bg-black/70 ${selectedFile ? 'text-green-400 border-green-500/30' : ''}`}
                />

                {/* File Input Trigger */}
                <div className="absolute right-3 top-3">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    title="Upload local file"
                  >
                    <Upload size={20} />
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={step !== 'idle' && step !== 'completed'}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-neon flex items-center justify-center gap-2 transform active:scale-95"
            >
              {step === 'idle' || step === 'completed' ? (
                <>
                  <Sparkles size={20} /> Generate AI Commercial
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </form>
        </div>

        {/* Progress Section */}
        {step !== 'idle' && step !== 'completed' && (
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 mb-8 animate-fade-in-up">
            <div className="space-y-4">
              {steps.map((s, idx) => {
                const isActive = s.id === step;
                const isPast = steps.findIndex(x => x.id === step) > idx;

                return (
                  <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${isActive || isPast ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`p-2 rounded-full ${isActive ? 'bg-primary/20 text-primary animate-pulse' : isPast ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                      {isPast ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                    </div>
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3 animate-shake">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Result Section */}
        {step === 'completed' && resultVideo && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative group">
              <video
                src={resultVideo}
                controls
                autoPlay
                loop
                className="w-full aspect-video object-cover"
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={resultVideo}
                  download="ad_spot.mp4"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-white/10"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            </div>

            {/* Analysis Data */}
            <div className="bg-surface border border-gray-800 rounded-2xl p-6">
              <h3 className="text-gray-400 font-medium uppercase tracking-wider text-xs mb-4">Agent Output</h3>
              <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Mic size={16} />
                    <span className="text-xs font-bold uppercase">Uzbek Script</span>
                  </div>
                  <p className="text-lg font-medium leading-relaxed">"{analysis?.script_uzbek}"</p>
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-2 mb-2 text-accent">
                    <Film size={16} />
                    <span className="text-xs font-bold uppercase">Visual Prompt</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{analysis?.visual_prompt}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
