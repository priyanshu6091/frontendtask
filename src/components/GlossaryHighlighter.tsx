import React, { useMemo, useState, useCallback } from 'react';
import { AIService } from '../services/aiService';
import { GlossaryTooltip } from './GlossaryTooltip';

interface GlossaryHighlighterProps {
  content: string;
  className?: string;
}

const GlossaryHighlighter: React.FC<GlossaryHighlighterProps> = ({
  content,
  className = ""
}) => {
  const [hoveredTerm, setHoveredTerm] = useState<string>('');
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('glossary-term')) {
      const term = target.dataset.term;
      if (term) {
        const rect = target.getBoundingClientRect();
        setHoveredTerm(term);
        setHoveredPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    }
  }, []);

  const handleMouseOut = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('glossary-term')) {
      setHoveredTerm('');
      setHoveredPosition(null);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('glossary-term')) {
      e.preventDefault();
      const term = target.dataset.term;
      if (term) {
        const rect = target.getBoundingClientRect();
        setHoveredTerm(term);
        setHoveredPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    }
  }, []);

  const processedContent = useMemo(() => {
    if (!content) return null;

    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (!plainText.trim()) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    try {
      const aiService = AIService.getInstance();
      const terms = aiService.identifyKeyTerms(plainText);

      if (terms.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
      }

      let processed = content;
      const sortedTerms = terms.sort((a, b) => b.length - a.length);
      
      sortedTerms.forEach((term, index) => {
        const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        processed = processed.replace(regex, (match) => {
          return `<span class="glossary-term" data-term="${match}" data-term-id="${index}">${match}</span>`;
        });
      });

      return (
        <div 
          dangerouslySetInnerHTML={{ __html: processed }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={handleClick}
        />
      );
    } catch (error) {
      console.error('Error processing glossary terms:', error);
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
  }, [content, handleMouseOver, handleMouseOut, handleClick]);

  return (
    <div className={`glossary-container relative ${className}`}>
      {processedContent}
      
      {hoveredTerm && hoveredPosition && (
        <GlossaryTooltip
          term={hoveredTerm}
          position={hoveredPosition}
          onClose={() => {
            setHoveredTerm('');
            setHoveredPosition(null);
          }}
        />
      )}
      
      <style>{`
        .glossary-container .glossary-term {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 1px 2px;
          border-radius: 3px;
          cursor: help;
          transition: all 0.2s ease;
          position: relative;
          border-bottom: 1px dotted #3b82f6;
        }
        
        .glossary-container .glossary-term:hover {
          background-color: #bfdbfe;
          color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
};

export { GlossaryHighlighter };
export default GlossaryHighlighter;
