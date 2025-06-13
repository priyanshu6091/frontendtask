import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AIService } from '../services/aiService';
import { AlertCircle, CheckCircle, RefreshCw, Loader2, X, BookOpen, Award, Target } from 'lucide-react';
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

  const checkGrammar = useCallback(async () => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText || plainText.length < 10 || plainText === lastCheckedContent) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const aiService = AIService.getInstance();
      const grammarResults = await aiService.checkGrammar(plainText);
      
      // Transform AI results into our format
      const formattedSuggestions: GrammarSuggestion[] = grammarResults.map((result) => ({
        original: result.text,
        suggestion: result.suggestions[0] || result.text, // Use first suggestion or keep original
        type: result.type as 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone',
        explanation: result.message,
        position: {
          start: result.offset,
          end: result.offset + result.length
        },
        severity: (result.text.length > 10 ? 'high' : result.text.length > 5 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        confidence: Math.min(95, Math.max(70, 100 - result.text.length * 2)) // Mock confidence based on text length
      })).filter(suggestion => suggestion.suggestion !== suggestion.original);

      setSuggestions(formattedSuggestions);
      setLastCheckedContent(plainText);
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
    const timer = setTimeout(() => {
      if (content.trim()) {
        checkGrammar();
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [content, checkGrammar]);

  const handleApplySuggestion = (suggestion: GrammarSuggestion) => {
    onApplySuggestion(suggestion);
    // Remove applied suggestion from list
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleDismissSuggestion = (suggestion: GrammarSuggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleApplyAll = () => {
    // Sort suggestions by severity and apply them in order
    const sortedSuggestions = [...suggestions].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    let updatedContent = content;
    sortedSuggestions.forEach(suggestion => {
      updatedContent = updatedContent.replace(suggestion.original, suggestion.suggestion);
    });

    // Apply all changes at once
    const mockSuggestion = {
      original: content,
      suggestion: updatedContent,
      type: 'style' as const,
      explanation: 'Applied all grammar suggestions',
      position: { start: 0, end: content.length },
      severity: 'medium' as const,
      confidence: 95
    };
    
    onApplySuggestion(mockSuggestion);
    setSuggestions([]);
  };

  const sortedSuggestions = useMemo(() => {
    return [...suggestions].sort((a, b) => {
      // Sort by severity first (high > medium > low), then by confidence
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });
  }, [suggestions]);

  const getSuggestionIcon = (type: string, severity?: string) => {
    const sizeClass = severity === 'high' ? 'size-5' : 'size-4';
    switch (type) {
      case 'grammar':
        return <AlertCircle className={clsx("text-red-500", sizeClass)} />;
      case 'spelling':
        return <AlertCircle className={clsx("text-orange-500", sizeClass)} />;
      case 'style':
        return <BookOpen className={clsx("text-blue-500", sizeClass)} />;
      case 'clarity':
        return <Target className={clsx("text-purple-500", sizeClass)} />;
      case 'tone':
        return <Award className={clsx("text-green-500", sizeClass)} />;
      default:
        return <AlertCircle className={clsx("text-gray-500", sizeClass)} />;
    }
  };

  const getSuggestionColor = (type: string, severity: string) => {
    const baseColors = {
      grammar: 'border-red-200 bg-red-50',
      spelling: 'border-orange-200 bg-orange-50',
      style: 'border-blue-200 bg-blue-50',
      clarity: 'border-purple-200 bg-purple-50',
      tone: 'border-green-200 bg-green-50'
    };
    
    const severityIntensity = severity === 'high' ? 'ring-2 ring-opacity-20' : '';
    return clsx(baseColors[type as keyof typeof baseColors] || 'border-gray-200 bg-gray-50', severityIntensity);
  };

  const getStats = () => {
    const stats = {
      grammar: suggestions.filter(s => s.type === 'grammar').length,
      spelling: suggestions.filter(s => s.type === 'spelling').length,
      style: suggestions.filter(s => s.type === 'style').length,
      clarity: suggestions.filter(s => s.type === 'clarity').length,
      tone: suggestions.filter(s => s.type === 'tone').length,
      high: suggestions.filter(s => s.severity === 'high').length,
      medium: suggestions.filter(s => s.severity === 'medium').length,
      low: suggestions.filter(s => s.severity === 'low').length
    };
    return stats;
  };

  if (!content.trim()) {
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
          <h3 className="font-medium text-gray-900">Grammar & Style</h3>
          {loading && <Loader2 size={16} className="animate-spin text-blue-500" />}
        </div>
        
        <button
          onClick={checkGrammar}
          disabled={loading}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
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
            <span className="text-sm font-medium">Grammar Check Error</span>
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

      {/* No Suggestions */}
      {!loading && suggestions.length === 0 && !error && lastCheckedContent && (
        <div className="text-center py-6">
          <CheckCircle size={32} className="mx-auto mb-3 text-green-500" />
          <p className="text-sm font-medium text-gray-900 mb-1">Great job!</p>
          <p className="text-sm text-gray-600">No grammar or style issues found.</p>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          {/* Enhanced Stats */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Analysis Summary</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{suggestions.length} issues found</span>
                {suggestions.length > 1 && (
                  <button
                    onClick={handleApplyAll}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    Apply All
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {getStats().grammar > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle size={12} />
                  <span>{getStats().grammar} Grammar</span>
                </div>
              )}
              {getStats().spelling > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle size={12} />
                  <span>{getStats().spelling} Spelling</span>
                </div>
              )}
              {getStats().style > 0 && (
                <div className="flex items-center gap-1 text-blue-600">
                  <BookOpen size={12} />
                  <span>{getStats().style} Style</span>
                </div>
              )}
              {getStats().clarity > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Target size={12} />
                  <span>{getStats().clarity} Clarity</span>
                </div>
              )}
              {getStats().tone > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Award size={12} />
                  <span>{getStats().tone} Tone</span>
                </div>
              )}
            </div>
          </div>
          
          {sortedSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={clsx(
                'p-3 rounded-lg border transition-all',
                getSuggestionColor(suggestion.type, suggestion.severity)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSuggestionIcon(suggestion.type, suggestion.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {suggestion.type}
                    </span>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      suggestion.severity === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {suggestion.severity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {suggestion.confidence}% confidence
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Change: </span>
                      <span className="bg-red-100 text-red-800 px-1 rounded">
                        "{suggestion.original}"
                      </span>
                      <span className="text-gray-600 mx-2">→</span>
                      <span className="bg-green-100 text-green-800 px-1 rounded">
                        "{suggestion.suggestion}"
                      </span>
                    </div>
                  </div>
                  
                  {suggestion.explanation && (
                    <p className="text-sm text-gray-600 mb-3">
                      {suggestion.explanation}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                    
                    <button
                      onClick={() => handleDismissSuggestion(suggestion)}
                      className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDismissSuggestion(suggestion)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
                  title="Dismiss suggestion"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {lastCheckedContent && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {lastCheckedContent.split(/\s+/).length} words checked
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