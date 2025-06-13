import React, { useState, useEffect } from 'react';
import { AIService } from '../services/aiService';
import type { ContentInsight, NoteSuggestion } from '../services/aiService';
import { Sparkles, Lightbulb, Hash, FileText, TrendingUp, Loader2, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import type { Note } from '../types';

interface AIInsightsProps {
  note: Note;
  allNotes: Note[];
  isVisible: boolean;
  onClose: () => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ 
  note, 
  allNotes, 
  isVisible, 
  onClose 
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
    <div className="bg-gradient-to-br from-white to-purple-50/30 border-l border-border/20 w-80 flex flex-col h-full shadow-xl">
      {/* Enhanced Header */}
      <div className="p-5 border-b border-border/10 bg-gradient-to-br from-purple-50 to-blue-50/70 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
              <Sparkles className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Smart content analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateInsights()}
              disabled={loading}
              className="btn btn-ghost btn-sm hover-scale disabled:opacity-50 hover:bg-purple-50 hover:text-purple-600"
              title="Refresh insights"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm hover-scale hover:bg-red-50 hover:text-red-600"
              title="Close insights"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          AI-powered analysis providing summaries, key themes, and actionable suggestions for your content.
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="relative">
                <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-purple-200 rounded-full animate-ping"></div>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Analyzing content</p>
                <p className="text-sm text-muted-foreground">AI is processing your note...</p>
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
                  <h4 className="font-semibold text-foreground text-sm">Content Analysis</h4>
                </div>
                {insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="card hover:shadow-md transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <button
                      onClick={() => toggleSection(`insight-${index}`)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/30 transition-all duration-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gradient-to-br from-surface to-muted/20 rounded-lg">
                          {getInsightIcon(insight.type)}
                        </div>
                        <span className="font-medium text-foreground">{insight.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          insight.confidence > 0.7 ? 'bg-green-500' :
                          insight.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        {expandedSections.has(`insight-${index}`) ? (
                          <ChevronUp size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    {expandedSections.has(`insight-${index}`) && (
                      <div className="px-4 pb-4 border-t border-border/10 mt-2 pt-3">
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {insight.type === 'keywords' ? (
                            <div className="flex flex-wrap gap-2">
                              {insight.content.split(',').map((keyword, i) => (
                                <span
                                  key={i}
                                  className="badge bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-default"
                                >
                                  {keyword.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-foreground">{insight.content}</p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-muted rounded-full flex-1 w-20">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  insight.confidence > 0.7 ? 'bg-green-500' :
                                  insight.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${insight.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
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
                  <h4 className="font-semibold text-foreground text-sm">Smart Suggestions</h4>
                </div>
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="card bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border-yellow-200/50 hover:shadow-md transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${(insights.length + index) * 100}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-1.5 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground leading-relaxed font-medium">
                            {suggestion.message}
                          </p>
                          {suggestion.noteId && suggestion.noteTitle && (
                            <div className="mt-3">
                              <span className="badge bg-blue-100 text-blue-800 border-blue-200">
                                <FileText size={12} className="mr-1" />
                                Related: {suggestion.noteTitle}
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

            {/* Enhanced Note Statistics */}
            <div className="card bg-gradient-to-br from-gray-50 to-gray-100/50">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
                  <h4 className="font-semibold text-foreground text-sm">Content Statistics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-border/20">
                    <div className="text-lg font-bold text-blue-600">
                      {note.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-border/20">
                    <div className="text-lg font-bold text-green-600">
                      {note.content.replace(/<[^>]*>/g, '').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Characters</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-border/20">
                    <div className="text-lg font-bold text-purple-600">
                      {Math.max(1, Math.ceil(note.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))}
                    </div>
                    <div className="text-xs text-muted-foreground">Min read</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-border/20">
                    <div className="text-lg font-bold text-orange-600">
                      {AIService.getInstance().identifyKeyTerms(note.content.replace(/<[^>]*>/g, '')).length}
                    </div>
                    <div className="text-xs text-muted-foreground">AI terms</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Empty State */}
            {insights.length === 0 && suggestions.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center">
                  <Sparkles className="text-purple-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready for insights</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Write more content to unlock AI-powered analysis, summaries, and smart suggestions.
                </p>
                <button
                  onClick={generateInsights}
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles size={16} />
                  Generate Insights
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Footer */}
      {!loading && (insights.length > 0 || suggestions.length > 0) && (
        <div className="p-5 border-t border-border/10 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <button
            onClick={generateInsights}
            className="btn btn-primary w-full hover-lift"
          >
            <Sparkles size={16} />
            <span>Refresh AI Insights</span>
          </button>
          <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Powered by advanced AI analysis</span>
          </div>
        </div>
      )}
    </div>
  );
};
