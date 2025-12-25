import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cost: number;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, cost }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-zinc-800 relative animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-4 text-white">Confirm Render</h2>
        <div className="mb-6">
          <p className="text-zinc-400 text-sm">You are about to begin the rendering process. This action is non-refundable.</p>
          <div className="mt-4 flex justify-between items-center p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 text-sm font-medium">Total Cost</span>
              <span className="text-xl font-bold text-white">${cost.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex space-x-3">
            <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-all"
            >
                Start Render
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;