import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AIService } from '../services/aiService';
import { AlertCircle, CheckCircle, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface GrammarSuggestion {
  original: string;
  suggestion: string;
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone';
  explanation: string;
  position: {
    start: number;
    end: number;
  };
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface GrammarCheckProps {
  content: string;
  onApplySuggestion: (suggestion: GrammarSuggestion) => void;
  className?: string;
}

export const GrammarCheck: React.FC<GrammarCheckProps> = ({
  content,
  onApplySuggestion,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<GrammarSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedContent, setLastCheckedContent] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const checkGrammar = useCallback(async () => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText || plainText.length < 10) {
      return;
    }

    // Don't recheck same content
    if (plainText === lastCheckedContent) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const aiService = AIService.getInstance();
      const grammarResults = await aiService.checkGrammar(plainText);
      
      // Convert AI service results to component format
      const formattedSuggestions: GrammarSuggestion[] = grammarResults.map((result) => ({
        original: result.text,
        suggestion: result.suggestions[0] || result.text,
        type: result.type as GrammarSuggestion['type'],
        explanation: result.message,
        position: {
          start: result.offset,
          end: result.offset + result.length
        },
        severity: (result.severity || 'medium') as GrammarSuggestion['severity'],
        confidence: result.confidence || 80
      })).filter(s => s.suggestion !== s.original);

      setSuggestions(formattedSuggestions);
      setLastCheckedContent(plainText);
      setExpandedCards(new Set()); // Reset expanded cards
    } catch (err) {
      console.error('Grammar check failed:', err);
      setError('Grammar check temporarily unavailable. Please try again later.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [content, lastCheckedContent]);

  // Auto-check grammar when content changes (debounced)
  useEffect(() => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText || plainText.length < 10) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      checkGrammar();
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, checkGrammar]);

  const handleApplySuggestion = (suggestion: GrammarSuggestion) => {
    onApplySuggestion(suggestion);
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleDismissSuggestion = (suggestion: GrammarSuggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleApplyAll = () => {
    let updatedContent = content;
    
    // Apply all suggestions - sort by position descending to avoid offset issues
    const sortedSuggestions = [...suggestions].sort((a, b) => b.position.start - a.position.start);
    
    sortedSuggestions.forEach(suggestion => {
      updatedContent = updatedContent.replace(suggestion.original, suggestion.suggestion);
    });

    // Apply all changes at once
    const mockSuggestion: GrammarSuggestion = {
      original: content,
      suggestion: updatedContent,
      type: 'style',
      explanation: 'Applied all grammar suggestions',
      position: { start: 0, end: content.length },
      severity: 'medium',
      confidence: 95
    };
    
    onApplySuggestion(mockSuggestion);
    setSuggestions([]);
  };

  const toggleCardExpanded = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const sortedSuggestions = useMemo(() => {
    return [...suggestions].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });
  }, [suggestions]);

  const getStats = () => ({
    grammar: suggestions.filter(s => s.type === 'grammar').length,
    spelling: suggestions.filter(s => s.type === 'spelling').length,
    style: suggestions.filter(s => s.type === 'style').length,
    clarity: suggestions.filter(s => s.type === 'clarity').length,
    tone: suggestions.filter(s => s.type === 'tone').length,
    high: suggestions.filter(s => s.severity === 'high').length,
    medium: suggestions.filter(s => s.severity === 'medium').length,
    low: suggestions.filter(s => s.severity === 'low').length
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'bg-red-100 text-red-800';
      case 'spelling': return 'bg-orange-100 text-orange-800';
      case 'style': return 'bg-blue-100 text-blue-800';
      case 'clarity': return 'bg-purple-100 text-purple-800';
      case 'tone': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Empty state
  if (!content.replace(/<[^>]*>/g, '').trim()) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <AlertCircle size={20} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Start writing to see grammar suggestions</p>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Grammar & Style</h3>
          {loading && <Loader2 size={16} className="animate-spin text-blue-500" />}
        </div>
        
        <button
          onClick={checkGrammar}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Refresh grammar check"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={checkGrammar}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Analyzing your text...</p>
          </div>
        </div>
      )}

      {/* No Suggestions - All Good */}
      {!loading && suggestions.length === 0 && !error && lastCheckedContent && (
        <div className="text-center py-6">
          <CheckCircle size={32} className="mx-auto mb-3 text-green-500" />
          <p className="text-sm font-medium text-gray-900 mb-1">Looking good!</p>
          <p className="text-sm text-gray-600">No grammar or style issues found.</p>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Found {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
              </span>
              {suggestions.length > 1 && (
                <button
                  onClick={handleApplyAll}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
                >
                  Apply All
                </button>
              )}
            </div>
            
            {/* Type breakdown */}
            <div className="flex flex-wrap gap-2">
              {getStats().grammar > 0 && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                  {getStats().grammar} Grammar
                </span>
              )}
              {getStats().spelling > 0 && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                  {getStats().spelling} Spelling
                </span>
              )}
              {getStats().style > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {getStats().style} Style
                </span>
              )}
              {getStats().clarity > 0 && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                  {getStats().clarity} Clarity
                </span>
              )}
              {getStats().tone > 0 && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  {getStats().tone} Tone
                </span>
              )}
            </div>
          </div>
          
          {/* Suggestion Cards */}
          {sortedSuggestions.map((suggestion, index) => {
            const isExpanded = expandedCards.has(index);
            
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCardExpanded(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx('text-xs px-2 py-0.5 rounded font-medium', getTypeColor(suggestion.type))}>
                        {suggestion.type}
                      </span>
                      <span className={clsx('text-xs px-2 py-0.5 rounded border', getSeverityColor(suggestion.severity))}>
                        {suggestion.severity}
                      </span>
                      <span className="text-xs text-gray-500">{suggestion.confidence}% confidence</span>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-2 text-sm">
                    <span className="text-red-600 line-through">{suggestion.original.slice(0, 50)}{suggestion.original.length > 50 ? '...' : ''}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-green-600">{suggestion.suggestion.slice(0, 50)}{suggestion.suggestion.length > 50 ? '...' : ''}</span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    {/* Full Change */}
                    <div className="space-y-2 mb-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Original:</span>
                        <div className="mt-1 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                          <span className="line-through">{suggestion.original}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggested:</span>
                        <div className="mt-1 p-2 bg-green-50 border border-green-100 rounded text-sm text-green-700 whitespace-pre-wrap">
                          {suggestion.suggestion}
                        </div>
                      </div>
                    </div>
                    
                    {/* Explanation */}
                    <div className="p-2 bg-blue-50 border border-blue-100 rounded mb-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Why:</span> {suggestion.explanation}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissSuggestion(suggestion);
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplySuggestion(suggestion);
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                      >
                        Apply Fix
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Stats */}
      {lastCheckedContent && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {lastCheckedContent.split(/\s+/).length} words analyzed
            </span>
            <span>
              Last checked: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
