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

    // Clean any existing glossary spans to avoid double processing
    let cleanContent = content.replace(/<span[^>]*class="glossary-term"[^>]*>(.*?)<\/span>/gi, '$1');
    
    // Remove any data-term-id attributes which may be causing display issues
    cleanContent = cleanContent.replace(/data-term-id="[^"]*"/gi, '');
    
    // Extract plain text for term identification (while preserving valid HTML)
    const plainText = cleanContent.replace(/<[^>]*>/g, '');
    
    if (!plainText.trim()) {
      return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
    }

    try {
      const aiService = AIService.getInstance();
      const terms = aiService.identifyKeyTerms(plainText);

      if (terms.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
      }

      // Use DOM parser to properly handle HTML without breaking it
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanContent, 'text/html');
      
      // Find all text nodes in the document
      const textNodes: Node[] = [];
      const findTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node);
        } else {
          node.childNodes.forEach(findTextNodes);
        }
      };
      
      findTextNodes(doc.body);
      
      // Sort terms by length for better matching
      const sortedTerms = terms.sort((a, b) => b.length - a.length);
      
      // Process each text node to highlight terms
      textNodes.forEach(textNode => {
        let text = textNode.textContent || '';
        
        sortedTerms.forEach((term) => {
          const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
          
          if (regex.test(text)) {
            // Create a span for each match
            const parts = text.split(regex);
            
            if (parts.length > 1) {
              const fragment = document.createDocumentFragment();
              
              parts.forEach((part, i) => {
                if (part.toLowerCase() === term.toLowerCase() && i % 2 === 1) {
                  // This is a matched term
                  const span = document.createElement('span');
                  span.className = 'glossary-term';
                  span.setAttribute('data-term', part.toLowerCase());
                  span.textContent = part;
                  fragment.appendChild(span);
                } else if (part) {
                  // This is regular text
                  fragment.appendChild(document.createTextNode(part));
                }
              });
              
              const parent = textNode.parentNode;
              if (parent) {
                parent.replaceChild(fragment, textNode);
              }
            }
          }
        });
      });
      
      // Get the processed HTML
      const processedHtml = doc.body.innerHTML;
      
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={handleClick}
        />
      );
    } catch (error) {
      console.error('Error processing glossary terms:', error);
      return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
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
