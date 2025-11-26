import React, { useState, useEffect, useRef } from 'react';
import { AIService } from '../services/aiService';
import {
  Loader2,
  X,
  BookOpen,
  ExternalLink
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded shadow-lg relative animate-fade-in"
      >
        {/* Header - Minimal */}
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-gray-700" strokeWidth={1.5} />
            <h3 className="font-medium text-sm text-gray-900">{term}</h3>
          </div>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded p-1 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 size={24} className="animate-spin text-gray-400 mb-2" />
              <p className="text-sm">Loading definition...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={fetchDefinition}
                className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              {/* Definition */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Definition</p>
                <p className="text-sm text-gray-900 leading-relaxed">{definition}</p>
              </div>

              <p className="text-xs text-gray-500 italic">
                AI-generated definition • Click outside to close
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              Learn More
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
