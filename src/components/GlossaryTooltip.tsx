import React, { useState, useEffect, useRef } from 'react';
import { AIService } from '../services/aiService';
import { Loader2, Info, X } from 'lucide-react';

interface GlossaryTooltipProps {
  term: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({
  term,
  position,
  onClose
}) => {
  const [definition, setDefinition] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (term && !definition) {
      fetchDefinition();
    }
  }, [term, definition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const fetchDefinition = async () => {
    setLoading(true);
    setError('');
    
    try {
      const aiService = AIService.getInstance();
      const def = await aiService.getTermDefinition(term);
      setDefinition(def);
    } catch (err) {
      setError('Failed to load definition');
      console.error('Error fetching definition:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      ref={tooltipRef}
      className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-4 max-w-sm shadow-xl border border-gray-700"
      style={{
        left: `${Math.max(10, Math.min(position.x - 150, window.innerWidth - 320))}px`,
        top: `${Math.max(10, position.y - 10)}px`,
        transform: position.y < 100 ? 'translateY(10px)' : 'translateY(-100%)'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-blue-400 flex-shrink-0" />
          <div className="font-medium text-blue-400">{term}</div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="text-gray-100">
        {loading && (
          <div className="flex items-center gap-2 text-gray-300">
            <Loader2 size={14} className="animate-spin" />
            <span>Loading definition...</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-xs">{error}</div>
        )}
        
        {definition && !loading && (
          <div className="text-xs leading-relaxed">
            {definition}
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <div 
        className="absolute w-0 h-0 border-l-4 border-r-4 border-transparent"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          ...(position.y < 100 
            ? { 
                top: '-4px', 
                borderBottomColor: '#1f2937',
                borderBottomWidth: '4px'
              }
            : { 
                bottom: '-4px', 
                borderTopColor: '#1f2937',
                borderTopWidth: '4px'
              }
          )
        }}
      />
    </div>
  );
};
