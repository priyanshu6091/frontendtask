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
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose}
        style={{animation: 'backdropFadeIn 0.3s ease-out forwards'}}
      ></div>
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden"
        style={{
          animation: 'modalPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 0 10px -5px rgba(0, 0, 0, 0.1)',
          transform: 'scale(0.98)',
          opacity: 0
        }}
      >
        {/* Header with gradient animation */}
        <div 
          className="px-6 py-5 flex justify-between items-center gradient-shift"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6, #7c3aed)',
            backgroundSize: '300% 300%',
            animation: 'gradientShift 8s ease infinite'
          }}
        >
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white bg-opacity-20 rounded-full">
              <BookOpen size={20} className="text-white" style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'}} />
            </div>
            <div>
              <span className="text-xs font-medium text-blue-100 block mb-0.5">Term Definition</span>
              <h3 className="font-semibold text-lg tracking-tight">{term}</h3>
            </div>
          </div>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 transform hover:rotate-90"
            aria-label="Close"
            style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))'}}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content with improved styling */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 animate-fade-in">
              <div className="relative mb-6">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full" style={{animation: 'pulseLoader 1.5s infinite ease-in-out'}}></div>
              </div>
              <p className="font-medium">Loading definition for "{term}"...</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-6 max-w-xs">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 animate-progress-indeterminate"></div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-500 animate-fade-in">
              <div className="mb-4 p-4 bg-red-50 rounded-full">
                <Info size={32} className="text-red-400" />
              </div>
              <p className="text-center mb-6 font-medium text-red-600">{error}</p>
              <button
                onClick={fetchDefinition}
                className="px-5 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl flex items-center gap-2 hover:from-red-100 hover:to-red-200 transition-all shadow-sm"
              >
                <RefreshCw size={16} className="animate-spin-slow" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none animate-fade-in">
              {/* Premium definition card */}
              <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-xl mb-6 border border-blue-100 shadow-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-3xl"></div>
                <div className="font-medium text-indigo-800 flex items-center gap-2 mb-2">
                  <div className="p-1 bg-indigo-100 rounded">
                    <Info size={16} className="text-indigo-600" />
                  </div>
                  <span className="text-sm uppercase tracking-wider">Definition</span>
                </div>
                <p className="text-blue-900 text-lg leading-relaxed">{definition}</p>
              </div>
              
              {/* Extra information */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 animate-fade-in-delayed">
                <h4 className="text-gray-700 flex items-center gap-2 m-0">
                  <span className="text-indigo-500">✨</span> Did you know?
                </h4>
                <p className="text-gray-600 mb-0">
                  Click any highlighted term in your notes to instantly view its definition.
                </p>
              </div>
              
              <div className="text-xs text-gray-500 mt-6 p-3 border-t border-gray-100">
                <p className="italic flex items-center gap-1.5">
                  <span className="text-indigo-400 text-sm">ℹ️</span>
                  AI-powered definitions are generated automatically and may be refined over time.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Footer */}
        <div className="px-6 py-4 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {!loading && !error && "Powered by Groq AI"}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium shadow-sm hover:shadow"
            >
              Close
            </button>
            {!loading && !error && (
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-1.5 shadow-sm hover:shadow font-medium"
              >
                Learn More
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
