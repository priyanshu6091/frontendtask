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

  // Calculate optimal positioning for the tooltip
  const calculatePosition = () => {
    // Viewport boundaries
    const viewportWidth = window.innerWidth;
    
    // Default tooltip dimensions - smaller width for better positioning
    const tooltipWidth = 250;
    const tooltipHeight = 120; // Approximate height
    const tooltipGap = 10; // Space between tooltip and word
    
    // Get cursor position adjusted for scroll
    const cursorX = position.x;
    const elementTop = position.y;
    
    // Calculate positions - align with cursor but ensure within viewport 
    let left = cursorX - (tooltipWidth / 2);
    let top = elementTop - tooltipHeight - tooltipGap; // Position above the word with a gap
    let arrowLeft = '50%'; // Default for centered arrow
    let showAbove = true;
    
    // Adjust horizontal position if too close to edges
    if (left < 20) {
      // Near left edge
      arrowLeft = `${cursorX - 20}px`; // Position arrow at cursor
      left = 20;
    } else if (left + tooltipWidth > viewportWidth - 20) {
      // Near right edge
      const rightEdge = viewportWidth - 20;
      arrowLeft = `${cursorX - (rightEdge - tooltipWidth)}px`;
      left = rightEdge - tooltipWidth;
    } else {
      // Normal positioning - arrow directly under cursor
      arrowLeft = '50%';
    }
    
    // If tooltip would go above viewport, position it below the word instead
    if (top < 10) {
      top = elementTop + tooltipGap + 20; // Position below the word
      showAbove = false;
    }
    
    return { left, top, arrowLeft, showAbove };
  };
  
  const { left, top, arrowLeft, showAbove } = calculatePosition();

  return (
    <div 
      ref={tooltipRef}
      className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl border border-gray-700 backdrop-blur-sm tooltip-container"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: '250px',
        maxWidth: '95vw', 
        backdropFilter: 'blur(8px)',
        opacity: definition ? 1 : 0.97,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 1px rgba(255, 255, 255, 0.2)',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        transform: definition ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(-5px)',
        pointerEvents: 'all'
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
          <div className="flex flex-col items-center gap-3 py-2 text-gray-300">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs animate-pulse">Loading definition for "{term}"...</span>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-blue-500 animate-progress-indeterminate"></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-sm flex flex-col gap-2">
            <span>{error}</span>
            <button 
              onClick={fetchDefinition} 
              className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
            >
              Try again
            </button>
          </div>
        )}
        
        {definition && !loading && (
          <div className="text-xs leading-relaxed animate-fade-in">
            {definition}
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <div 
        className="absolute w-0 h-0 pointer-events-none"
        style={{
          left: arrowLeft,
          transform: 'translateX(-50%)',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          zIndex: 51,
          ...(showAbove 
            ? { 
                bottom: '-10px', 
                borderTop: '10px solid #1f2937',
              }
            : { 
                top: '-10px', 
                borderBottom: '10px solid #1f2937',
              }
          )
        }}
      />
    </div>
  );
};
