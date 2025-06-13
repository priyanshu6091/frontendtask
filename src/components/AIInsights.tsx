import React, { useState, useEffect } from 'react';
import { AIService } from '../services/aiService';
import type { ContentInsight, NoteSuggestion } from '../services/aiService';
import { Sparkles, Lightbulb, Hash, FileText, TrendingUp, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { Note } from '../types';

interface AIInsightsProps {
  note: Note;
  allNotes: Note[];
  isVisible: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ 
  note, 
  allNotes, 
  isVisible, 
  onClose: _onClose, // Rename to indicate it's provided but not used in this component
  isMobile = false
}) => {
  const [insights, setInsights] = useState<ContentInsight[]>([]);
  const [suggestions, setSuggestions] = useState<NoteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  useEffect(() => {
    if (isVisible && note && note.content.trim()) {
      // Debounce the insights generation to avoid too many API calls
      const timeoutId = setTimeout(() => {
        generateInsights();
      }, 1000); // Wait 1 second after content stops changing

      return () => clearTimeout(timeoutId);
    } else if (isVisible && (!note.content || !note.content.trim())) {
      // Clear insights if no content
      setInsights([]);
      setSuggestions([]);
    }
  }, [isVisible, note.id, note.content, note.title]);

  const generateInsights = async () => {
    const trimmedContent = note.content.trim();
    if (!trimmedContent) {
      setInsights([]);
      setSuggestions([]);
      return;
    }

    // Don't generate insights for very short content
    if (trimmedContent.length < 50) {
      setInsights([{
        type: 'summary',
        title: 'Content Too Short',
        content: 'Add more content to generate AI insights and suggestions.',
        confidence: 1.0
      }]);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const aiService = AIService.getInstance();
      
      // Generate content insights
      const contentInsights = await aiService.generateInsights(note.content, note.title);
      setInsights(contentInsights.length > 0 ? contentInsights : [{
        type: 'summary',
        title: 'No Insights Available',
        content: 'Unable to generate insights at this time. The AI service may be temporarily unavailable.',
        confidence: 0.0
      }]);

      // Generate note suggestions
      const noteSuggestions = await aiService.generateNoteSuggestions(
        { title: note.title, content: note.content },
        allNotes.map(n => ({ id: n.id, title: n.title, content: n.content }))
      );
      setSuggestions(noteSuggestions);
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsights([{
        type: 'summary',
        title: 'Error',
        content: 'Failed to generate insights. Please check your internet connection and try again.',
        confidence: 0.0
      }]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'summary': return <FileText size={16} className="text-blue-500" />;
      case 'keywords': return <Hash size={16} className="text-green-500" />;
      case 'suggestions': return <Lightbulb size={16} className="text-yellow-500" />;
      default: return <Sparkles size={16} className="text-purple-500" />;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improve': return <TrendingUp size={16} className="text-blue-500" />;
      case 'organize': return <Hash size={16} className="text-green-500" />;
      case 'expand': return <FileText size={16} className="text-purple-500" />;
      default: return <Lightbulb size={16} className="text-orange-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-white sm:bg-gradient-to-br sm:from-white sm:to-purple-50/30 border-l border-gray-200">
      {/* Enhanced Header - No close button here, it's handled in the parent component */}
      <div className={`p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50/70 ${isMobile ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl shadow-sm">
              <Sparkles className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">AI Insights</h3>
              <p className="text-xs text-gray-500">Smart content analysis</p>
            </div>
          </div>
          
          {/* Refresh button only */}
          <button
            onClick={() => generateInsights()}
            disabled={loading}
            className="p-2 rounded-full bg-white/80 hover:bg-purple-50 active:bg-purple-100 text-gray-600 hover:text-purple-600 transition-colors disabled:opacity-50 shadow-sm mobile-no-tap-highlight"
            title="Refresh insights"
            aria-label="Refresh insights"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">
          AI-powered analysis providing summaries, key themes, and actionable suggestions for your content.
        </div>
      </div>

      {/* Enhanced Content with Animations */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 mobile-swipeable transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12 scale-in">
            <div className="flex flex-col items-center gap-4 text-gray-500">
              <div className="relative">
                <Loader2 className="animate-spin w-10 h-10 text-purple-500" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-purple-200 rounded-full animate-ping opacity-50"></div>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                <p className="font-medium text-gray-800">Analyzing content</p>
                <p className="text-sm text-gray-500 mt-1">AI is processing your note...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Content Insights */}
            {insights.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-800 text-sm">Content Analysis</h4>
                </div>
                {insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in transform"
                    style={{ 
                      animationDelay: `${index * 100}ms`, 
                      transform: `translateY(${10 * (1 - Math.min(1, index * 0.1 + 0.1))}px)`,
                      transitionDelay: `${index * 50}ms` 
                    }}
                  >
                    <button
                      onClick={() => toggleSection(`insight-${index}`)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 rounded-t-xl mobile-no-tap-highlight"
                      aria-expanded={expandedSections.has(`insight-${index}`)}
                      aria-controls={`insight-content-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg shadow-sm">
                          {getInsightIcon(insight.type)}
                        </div>
                        <span className="font-medium text-gray-800">{insight.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          insight.confidence > 0.7 ? 'bg-green-500' :
                          insight.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} aria-hidden="true"></div>
                        {expandedSections.has(`insight-${index}`) ? (
                          <ChevronUp size={16} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-600" />
                        )}
                      </div>
                    </button>
                    
                    {expandedSections.has(`insight-${index}`) && (
                      <div 
                        id={`insight-content-${index}`}
                        className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50 pt-4 animate-fade-in"
                      >
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {insight.type === 'keywords' ? (
                            <div className="flex flex-wrap gap-2">
                              {insight.content.split(',').map((keyword, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-sm shadow-sm"
                                >
                                  {keyword.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p>{insight.content}</p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 w-full">
                            <div className="h-2 bg-gray-200 rounded-full flex-1">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  insight.confidence > 0.7 ? 'bg-green-500' :
                                  insight.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${insight.confidence * 100}%` }}
                                role="progressbar"
                                aria-valuenow={Math.round(insight.confidence * 100)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium min-w-[70px] text-right">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Note Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-800 text-sm">Smart Suggestions</h4>
                </div>
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in transform"
                    style={{ 
                      animationDelay: `${(insights.length + index) * 100 + 100}ms`,
                      transform: `translateY(${10 * (1 - Math.min(1, index * 0.1 + 0.1))}px)`,
                      transitionDelay: `${(insights.length + index) * 50}ms`
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 bg-white border border-yellow-100 rounded-lg shadow-sm">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed font-medium">
                            {suggestion.message}
                          </p>
                          {suggestion.noteId && suggestion.noteTitle && (
                            <div className="mt-3">
                              <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 max-w-full truncate shadow-sm">
                                <FileText size={14} />
                                <span className="truncate">Related: {suggestion.noteTitle}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Note Statistics with Animation */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 animate-fade-in" 
                 style={{ animationDelay: `${insights.length * 100 + suggestions.length * 100 + 100}ms` }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                  <h4 className="font-semibold text-gray-800 text-sm">Content Statistics</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-3 scale-in" 
                     style={{ animationDelay: `${insights.length * 100 + suggestions.length * 100 + 200}ms` }}>
                  <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <div className="text-xl font-bold text-blue-700">
                      {note.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}
                    </div>
                    <div className="text-xs text-blue-600 font-medium mt-1">Words</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <div className="text-xl font-bold text-green-700">
                      {note.content.replace(/<[^>]*>/g, '').length}
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-1">Characters</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <div className="text-xl font-bold text-purple-700">
                      {Math.max(1, Math.ceil(note.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))}
                    </div>
                    <div className="text-xs text-purple-600 font-medium mt-1">Min read</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '600ms' }}>
                    <div className="text-xl font-bold text-orange-700">
                      {AIService.getInstance().identifyKeyTerms(note.content.replace(/<[^>]*>/g, '')).length}
                    </div>
                    <div className="text-xs text-orange-600 font-medium mt-1">AI terms</div>
                  </div>
                </div>
              </div>

            {/* Enhanced Empty State with Animation */}
            {insights.length === 0 && suggestions.length === 0 && !loading && (
              <div className="text-center py-10 sm:py-12 bg-white border border-gray-100 rounded-xl shadow-sm scale-in">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm animate-pulse transition-all duration-700 hover:scale-110">
                  <Sparkles className="text-purple-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready for insights</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 max-w-xs mx-auto px-4">
                  Write more content to unlock AI-powered analysis, summaries, and smart suggestions.
                </p>
                <button
                  onClick={generateInsights}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white rounded-lg shadow-sm flex items-center gap-2 mx-auto mobile-no-tap-highlight transition-all duration-200"
                >
                  <Sparkles size={16} />
                  <span className="font-medium">Generate Insights</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Footer - Hidden in Mobile Modal View */}
      {!loading && (insights.length > 0 || suggestions.length > 0) && !isMobile && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 mobile-safe-area animate-fade-in" style={{ animationDelay: '700ms' }}>
          <button
            onClick={generateInsights}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-300 mobile-no-tap-highlight transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="font-medium">Refresh AI Insights</span>
          </button>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">Powered by advanced AI analysis</span>
          </div>
        </div>
      )}
      
      {/* Mobile Footer - Only for standalone component, not in modal */}
      {!loading && (insights.length > 0 || suggestions.length > 0) && isMobile && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 mobile-safe-area animate-fade-in" style={{ animationDelay: '700ms' }}>
          <button
            onClick={generateInsights}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-300 mobile-no-tap-highlight transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="font-medium">Refresh Analysis</span>
          </button>
        </div>
      )}
    </div>
  );
};
