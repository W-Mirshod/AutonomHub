import React, { useState } from 'react';

// Spinner icon for loading state
const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-5 h-5 mr-2 animate-spin"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddFunds: () => Promise<any>;
}

const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, balance, onAddFunds }) => {
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  if (!isOpen) return null;

  const handleAddFunds = async () => {
    setIsAddingFunds(true);
    await onAddFunds();
    setIsAddingFunds(false);
  };

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
        <h2 className="text-xl font-bold mb-6 text-white">Wallet & Billing</h2>
        <div className="mb-8 text-center p-6 bg-zinc-950 rounded-xl border border-zinc-800">
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mb-2">Current Balance</p>
          <p className="text-4xl font-bold text-white">${balance.toFixed(2)}</p>
        </div>
        <div className="space-y-4">
            <p className="text-xs text-zinc-400 text-center">Standard generation rate is $10.00 per video.</p>
            <button
              onClick={handleAddFunds}
              disabled={isAddingFunds}
              className="w-full flex items-center justify-center bg-white hover:bg-zinc-200 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-wait"
            >
              {isAddingFunds ? (
                <>
                  <SpinnerIcon />
                  <span>Processing...</span>
                </>
              ) : (
                'Add $20.00 Funds'
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;