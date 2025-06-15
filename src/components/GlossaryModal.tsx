import React, { useState, useEffect, useRef } from 'react';
import { AIService } from '../services/aiService';
import { 
  Loader2, 
  X, 
  Info,
  BookOpen,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface GlossaryModalProps {
  term: string;
  onClose: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  term,
  onClose
}) => {
  const [definition, setDefinition] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  
  // Fetch definition when term changes
  useEffect(() => {
    if (term) {
      fetchDefinition();
    }
  }, [term]);
  
  // Add keyboard event listeners
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    initialFocusRef.current?.focus();
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const fetchDefinition = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const aiService = AIService.getInstance();
      const def = await aiService.getTermDefinition(term);
      setDefinition(def);
    } catch (err) {
      setError('Failed to load definition. Please try again.');
      console.error('Error fetching definition:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-fade-in">
      <div 
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" 
        onClick={onClose}
        style={{animation: 'backdropFadeIn 0.3s ease-out forwards'}}
      ></div>
      <div 
        ref={modalRef}
        className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl relative z-10 overflow-hidden"
        style={{
          animation: 'modalPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 0 10px -5px rgba(0, 0, 0, 0.1)',
          transform: 'scale(0.98)',
          opacity: 0
        }}
      >
        {/* Header with gradient animation */}
        <div 
          className="px-4 py-3 flex justify-between items-center gradient-shift"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6, #7c3aed)',
            backgroundSize: '300% 300%',
            animation: 'gradientShift 8s ease infinite',
            opacity: 0.9
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <div className="p-1.5 bg-white bg-opacity-20 rounded-full">
              <BookOpen size={16} className="text-white" style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'}} />
            </div>
            <div>
              <span className="text-xs font-medium text-blue-100 block mb-0.5 opacity-80">Term</span>
              <h3 className="font-semibold text-base tracking-tight">{term}</h3>
            </div>
          </div>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition-all duration-200 transform hover:rotate-90"
            aria-label="Close"
            style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))'}}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Content with improved styling */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500 animate-fade-in">
              <div className="relative mb-3">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
                <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full" style={{animation: 'pulseLoader 1.5s infinite ease-in-out'}}></div>
              </div>
              <p className="text-sm font-medium">Loading definition for "{term}"...</p>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-4 max-w-xs">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 animate-progress-indeterminate"></div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-5 text-red-500 animate-fade-in">
              <div className="mb-3 p-2 bg-red-50 rounded-full">
                <Info size={24} className="text-red-400" />
              </div>
              <p className="text-center mb-3 font-medium text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchDefinition}
                className="px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-lg flex items-center gap-2 hover:from-red-100 hover:to-red-200 transition-all shadow-sm text-sm"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="prose max-w-none animate-fade-in">
              {/* Premium definition card */}
              <div className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4 rounded-lg mb-3 border border-blue-100/50 shadow-sm">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-2xl"></div>
                <div className="font-medium text-indigo-800 flex items-center gap-1.5 mb-1.5">
                  <div className="p-0.5 bg-indigo-100 rounded">
                    <Info size={14} className="text-indigo-600" />
                  </div>
                  <span className="text-xs uppercase tracking-wider">Definition</span>
                </div>
                <p className="text-blue-900 text-base leading-relaxed mb-0">{definition}</p>
              </div>
              
              {/* Note - removing "Did you know" section to make the modal more compact */}
              
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                <p className="italic flex items-center gap-1 mb-0">
                  <span className="text-indigo-400 text-xs">ℹ️</span>
                  AI-powered definition (click outside to close)
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Footer */}
        <div className="px-4 py-3 bg-gradient-to-b from-white/80 to-gray-50/80 backdrop-blur-sm border-t border-gray-100/60 flex justify-end items-center gap-2">
          {!loading && !error && (
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600/90 to-blue-600/90 text-white rounded-md hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-1 shadow-sm hover:shadow text-xs font-medium"
            >
              Learn More
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
