import React, { useMemo, useState, useCallback } from 'react';
import { AIService } from '../services/aiService';
import { GlossaryModal } from './GlossaryModal';

interface GlossaryHighlighterProps {
  content: string;
  className?: string;
}

const GlossaryHighlighter: React.FC<GlossaryHighlighterProps> = ({
  content,
  className = ""
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Handle click on glossary term
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('glossary-term')) {
      e.preventDefault();
      e.stopPropagation();
      
      const term = target.dataset.term;
      if (term) {
        setSelectedTerm(term);
        setShowModal(true);
      }
    }
  }, []);

  // Close the modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
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
          onClick={handleClick}
        />
      );
    } catch (error) {
      console.error('Error processing glossary terms:', error);
      return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
    }
  }, [content, handleClick]);

  return (
    <div className={`glossary-container relative ${className}`}>
      {processedContent}
      
      {/* Modal that appears on term click */}
      {showModal && selectedTerm && (
        <GlossaryModal 
          term={selectedTerm}
          onClose={handleCloseModal}
        />
      )}
      
      <style>{`
        .glossary-container .glossary-term {
          background: linear-gradient(120deg, rgba(219, 234, 254, 0.4) 0%, rgba(199, 210, 254, 0.5) 100%);
          color: #3730a3;
          padding: 1px 4px;
          margin: 0 1px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          position: relative;
          border-bottom: 1.5px dashed rgba(79, 70, 229, 0.4);
          text-decoration: none;
          z-index: 2;
          display: inline-block;
          font-weight: 500;
        }
        
        .glossary-container .glossary-term:hover,
        .glossary-container .glossary-term:active {
          background: linear-gradient(120deg, rgba(199, 210, 254, 0.7) 0%, rgba(165, 180, 252, 0.8) 100%);
          color: #312e81;
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
          border-bottom-color: transparent;
        }
        
        /* Animation and visual effects for terms */
        .glossary-container .glossary-term::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
          z-index: -1;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .glossary-container .glossary-term:hover::before {
          opacity: 1;
        }
        
        .glossary-container .glossary-term::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, #4f46e5, #8b5cf6, #6366f1);
          transform: scaleX(0);
          transform-origin: 0 50%;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          border-radius: 4px;
        }
        
        .glossary-container .glossary-term:hover::after,
        .glossary-container .glossary-term:active::after {
          transform: scaleX(1.05);
        }
        
        /* Subtle info indicator */
        .glossary-container .glossary-term:hover::before {
          content: "";
          position: absolute;
          top: -4px;
          right: -4px;
          width: 8px;
          height: 8px;
          background: #4f46e5;
          border-radius: 50%;
          z-index: 3;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(79, 70, 229, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        
        /* Mobile optimization */
        @media (max-width: 768px) {
          .glossary-container .glossary-term {
            padding: 2px 5px;
            margin: 0 1px;
            border-bottom-width: 2px;
          }
          
          .glossary-container .glossary-term:active {
            background: linear-gradient(120deg, rgba(165, 180, 252, 0.9) 0%, rgba(139, 92, 246, 0.8) 100%);
            color: white;
            transform: translateY(-1px) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export { GlossaryHighlighter };
export default GlossaryHighlighter;
