import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Note } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { GlossaryHighlighter } from './GlossaryHighlighter';
import { AIInsights } from './AIInsights';
import { GrammarCheck } from './GrammarCheck';
import { EncryptionModal } from './EncryptionModal';
import { AIService } from '../services/aiService';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { 
  Save, 
  Pin, 
  Trash2, 
  ArrowLeft, 
  Sparkles, 
  Lock, 
  Unlock,
  Brain,
  X,
  Check,
  Edit3
} from 'lucide-react';
import { clsx } from 'clsx';

interface NoteEditorProps {
  note: Note | null;
  allNotes: Note[];
  onSave: (note: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onClose: () => void;
  isMobile?: boolean;
  enableGrammarCheck?: boolean;
  enableAIInsights?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  allNotes,
  onSave,
  onDelete,
  onPin,
  onClose,
  isMobile = false,
  enableGrammarCheck = true,
  enableAIInsights = true
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [isGrammarCheckExpanded, setIsGrammarCheckExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInsightTooltip, setShowInsightTooltip] = useState(false);
  const [showGrammarTooltip, setShowGrammarTooltip] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedContentRef = useRef('');
  const lastSavedTitleRef = useRef('');

  // Initialize note content
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.isEncrypted ? '🔒 This note is encrypted. Click unlock to view content.' : note.content);
      lastSavedContentRef.current = note.content;
      lastSavedTitleRef.current = note.title;
      setHasChanges(false);
      setIsEditing(false); // Start in view mode for existing notes
      
      // Show AI insights tooltip for first time users
      const hasSeenAITooltip = localStorage.getItem('hasSeenAITooltip');
      if (!hasSeenAITooltip && enableAIInsights && !note.isEncrypted) {
        setShowInsightTooltip(true);
        
        // Auto-hide tooltip after 5 seconds
        setTimeout(() => {
          setShowInsightTooltip(false);
          localStorage.setItem('hasSeenAITooltip', 'true');
        }, 5000);
      }
      
      // Show Grammar Check tooltip for first time users
      const hasSeenGrammarTooltip = localStorage.getItem('hasSeenGrammarTooltip');
      if (!hasSeenGrammarTooltip && enableGrammarCheck && !note.isEncrypted) {
        setShowGrammarTooltip(true);
        
        // Auto-hide tooltip after 5 seconds (after AI insights tooltip)
        setTimeout(() => {
          setShowGrammarTooltip(false);
          localStorage.setItem('hasSeenGrammarTooltip', 'true');
        }, 6000);
      }
    } else {
      setTitle('');
      setContent('');
      lastSavedContentRef.current = '';
      lastSavedTitleRef.current = '';
      setHasChanges(false);
      setIsEditing(true); // Start in edit mode for new notes
    }
  }, [note?.id, enableAIInsights, enableGrammarCheck]);

  // Track changes
  useEffect(() => {
    const titleChanged = title !== lastSavedTitleRef.current;
    const contentChanged = content !== lastSavedContentRef.current;
    setHasChanges(titleChanged || contentChanged);
  }, [title, content]);

  // Auto-save with debouncing
  useEffect(() => {
    if (hasChanges) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [hasChanges, title, content]);

  // Touch gestures for mobile
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures({
    onSwipeRight: isMobile ? onClose : undefined,
    onLongPress: isMobile && enableAIInsights ? () => setShowAIInsights(true) : undefined,
  });

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;

    const noteData: Partial<Note> = {
      id: note?.id,
      title: title || 'Untitled Note',
      content: content,
      isPinned: note?.isPinned || false,
      isEncrypted: note?.isEncrypted,
      encryptionData: note?.encryptionData,
    };

    onSave(noteData);
    lastSavedContentRef.current = content;
    lastSavedTitleRef.current = title;
    setHasChanges(false);
  };

  const handleEncryptionSuccess = (updatedNoteData: Partial<Note>) => {
    if (updatedNoteData.isEncrypted) {
      setContent('🔒 This note is encrypted. Click unlock to view content.');
    } else if (updatedNoteData.content) {
      setContent(updatedNoteData.content);
      if (updatedNoteData.title) {
        setTitle(updatedNoteData.title);
      }
    }
    
    // Update note with encryption changes
    if (note) {
      onSave({
        ...note,
        ...updatedNoteData,
        updatedAt: new Date()
      });
    }
    
    // Hide modal
    setShowEncryptionModal(false);
  };

  const handleGrammarSuggestion = (suggestion: any) => {
    const newContent = content.replace(suggestion.original, suggestion.suggestion);
    setContent(newContent);
  };

  // AI terms count for status bar
  const aiTermsCount = useMemo(() => {
    if (!content || note?.isEncrypted) return 0;
    const plainText = content.replace(/<[^>]*>/g, '');
    return AIService.getInstance().identifyKeyTerms(plainText).length;
  }, [content, note?.isEncrypted]);

  return (
    <div 
      className="h-full flex flex-col bg-white"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Responsive Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        {isMobile ? (
          // Mobile Header
          <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 float-in">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-300 mobile-no-tap-highlight button-pop"
              aria-label="Back to notes"
            >
              <ArrowLeft size={20} />
            </button>
            
            <h1 className="font-semibold text-gray-800 truncate flex-1 mx-3 reveal-left">
              {title || 'Untitled Note'}
            </h1>
            
            <div className="flex items-center gap-1 slide-up-fade stagger-2">
              {note && (
                <button
                  onClick={() => onPin(note.id)}
                  className={clsx(
                    'p-2 rounded-full transition-all duration-300 mobile-no-tap-highlight button-pop',
                    note.isPinned
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-400 hover:bg-gray-100 active:bg-gray-200'
                  )}
                  aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                >
                  <Pin size={18} className={clsx(
                    note.isPinned ? 'fill-current' : '',
                    'transition-transform duration-300',
                    !note.isPinned && 'group-hover:rotate-12'
                  )} />
                </button>
              )}
              
              {enableAIInsights && !note?.isEncrypted && (
                <button
                  onClick={() => setShowAIInsights(true)}
                  className={clsx(
                    "p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-300 flex items-center gap-1.5 button-pop",
                    showInsightTooltip && "pulse-animation"
                  )}
                  title="View AI insights and content analysis"
                >
                  <Brain size={16} className="transition-transform duration-300 hover:scale-110" />
                  <span className="text-xs font-medium">AI Insights</span>
                  
                  {/* Mobile first-time tooltip */}
                  {showInsightTooltip && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-purple-800 text-white p-2 rounded-md text-xs text-center slide-up-fade">
                      Get smart analysis of your notes!
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          // Desktop Header
          <div className="px-6 py-4 float-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 button-pop"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Note"
                  className="text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0 focus-border"
                />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 slide-up-fade">
                {enableAIInsights && !note?.isEncrypted && (
                  <div className="relative">
                    <button
                      onClick={() => setShowAIInsights(!showAIInsights)}
                      className={clsx(
                        'p-2 sm:px-3 rounded-full sm:rounded-lg transition-all duration-300 mobile-no-tap-highlight flex items-center gap-2 button-pop',
                        showAIInsights
                          ? 'bg-purple-100 text-purple-600 border border-purple-200'
                          : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:border hover:border-gray-200',
                        showInsightTooltip && 'pulse-animation'
                      )}
                      aria-label={showAIInsights ? "Hide AI insights" : "Show AI insights"}
                      title={showAIInsights ? "Hide AI insights" : "Show AI insights"}
                    >
                      <Brain size={isMobile ? 20 : 18} className="transition-transform duration-300 group-hover:rotate-12" />
                      <span className={clsx("hidden sm:inline text-sm font-medium", 
                        showAIInsights ? "text-purple-700" : "text-gray-700"
                      )}>
                        {showAIInsights ? "Hide Insights" : "AI Insights"}
                      </span>
                    </button>
                    
                    {/* New user tooltip - appears for 5 seconds for first-time users */}
                    {showInsightTooltip && (
                      <div className="absolute -bottom-20 right-0 w-64 bg-purple-800 text-white p-3 rounded-lg shadow-lg z-10 animate-fade-in">
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-purple-800 transform rotate-45"></div>
                        <p className="text-xs font-medium text-appear">
                          <span className="font-bold">AI Insights</span> analyzes your notes and provides summaries, key themes, and improvement suggestions!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {note && (
                  <>
                    <button
                      onClick={() => setShowEncryptionModal(true)}
                      className={clsx(
                        'p-2 sm:px-3 rounded-full sm:rounded-lg transition-all duration-300 mobile-no-tap-highlight flex items-center gap-2 button-pop',
                        note.isEncrypted
                          ? 'text-green-600 bg-green-50 border border-green-200'
                          : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:border hover:border-gray-200'
                      )}
                      aria-label={note.isEncrypted ? "Unlock note" : "Lock note"}
                      title={note.isEncrypted ? "Unlock note" : "Lock note"}
                    >
                      {note.isEncrypted ? 
                        <Unlock size={isMobile ? 20 : 18} className="transition-transform duration-300 hover:rotate-12" /> : 
                        <Lock size={isMobile ? 20 : 18} className="transition-transform duration-300 hover:rotate-12" />
                      }
                      <span className="hidden sm:inline text-sm font-medium">
                        {note.isEncrypted ? "Decrypt Note" : "Encrypt Note"}
                      </span>
                    </button>

                    <button
                      onClick={() => onPin(note.id)}
                      className={clsx(
                        'p-2 rounded-full sm:rounded-lg transition-all duration-300 mobile-no-tap-highlight button-pop',
                        note.isPinned
                          ? 'text-yellow-600 bg-yellow-50'
                          : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                      )}
                      aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                      title={note.isPinned ? "Unpin note" : "Pin note"}
                    >
                      <Pin 
                        size={isMobile ? 20 : 18} 
                        className={clsx(
                          note.isPinned ? 'fill-current' : '',
                          'transition-transform duration-300',
                          !note.isPinned && 'hover:rotate-12'
                        )}
                      />
                    </button>

                    <button
                      onClick={() => onDelete(note.id)}
                      className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-full sm:rounded-lg transition-all duration-300 mobile-no-tap-highlight button-pop"
                      aria-label="Delete note"
                      title="Delete note"
                    >
                      <Trash2 size={isMobile ? 20 : 18} className="transition-transform duration-300 hover:scale-110" />
                    </button>
                  </>
                )}

                {isMobile ? (
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                      'p-2 rounded-full transition-all duration-300 mobile-no-tap-highlight transform',
                      hasChanges
                        ? 'bg-blue-600 text-white active:bg-blue-700 hover:scale-110 active:scale-95'
                        : 'bg-gray-200 text-gray-500'
                    )}
                    aria-label="Save note"
                    title="Save note"
                  >
                    <Save size={20} className={clsx(hasChanges && "animate-pulse")} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                      'px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center',
                      hasChanges
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105 active:scale-95'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    <Save size={16} className={clsx("mr-2", hasChanges && "animate-pulse")} />
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className={clsx(
          'flex flex-col overflow-hidden transition-all duration-500 ease-in-out',
          showAIInsights && !isMobile ? 'w-2/3' : 'w-full'
        )}>
          {/* Mobile Title Input */}
          {isMobile && (
            <div className="px-4 py-3 border-b border-gray-200 float-in">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full text-xl font-semibold bg-transparent border-none outline-none focus-border"
              />
            </div>
          )}          
          {/* Content Area - Smart Inline Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }} ref={editorRef}>
              <div className="p-4 md:p-6 fade-in">
                <div className="max-w-4xl mx-auto slide-up-fade">
                  {!isEditing && content && !note?.isEncrypted ? (
                    // View mode with glossary highlighting
                    <div 
                      className="prose prose-sm md:prose-lg max-w-none cursor-text min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg hover:border-blue-300 transition-all duration-300 focus-border"
                      onClick={() => setIsEditing(true)}
                    >
                      <GlossaryHighlighter content={content} />
                    </div>
                  ) : !isEditing && !content && !note?.isEncrypted ? (
                    // Empty state
                    <div 
                      className="cursor-text min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 italic hover:border-blue-300 transition-all duration-300 focus-border"
                      onClick={() => setIsEditing(true)}
                    >
                      <span className="typewriter">Click to start writing your note...</span>
                    </div>
                  ) : note?.isEncrypted ? (
                    // Encrypted state
                    <div className="min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 italic transition-all duration-300">
                      <div className="text-6xl mb-4 float-in">🔒</div>
                      <p className="text-appear">This note is encrypted. Click unlock to view content.</p>
                    </div>
                  ) : (
                    // Edit mode with rich text editor
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Start writing your note..."
                      className="min-h-[400px] md:min-h-[500px] focus-border"
                      onFocus={() => setIsEditing(true)}
                      onBlur={() => setIsEditing(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grammar Check - Expandable Section */}
            {enableGrammarCheck && content && !note?.isEncrypted && (
              <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 relative slide-up-fade">
                <div className="relative">
                  <button
                    onClick={() => setIsGrammarCheckExpanded(!isGrammarCheckExpanded)}
                    className={clsx(
                      "w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-300",
                      isGrammarCheckExpanded 
                        ? "bg-gradient-to-r from-blue-50 to-blue-100/50" 
                        : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-white",
                      showGrammarTooltip && "pulse-animation"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={clsx(
                        "p-1.5 rounded-lg transition-all duration-300", 
                        isGrammarCheckExpanded ? "bg-blue-100" : "bg-blue-50"
                      )}>
                        {isGrammarCheckExpanded ? (
                          <Check size={16} className="text-blue-600 transition-transform duration-300 scale-fade-in" />
                        ) : (
                          <Edit3 size={16} className="text-blue-500 transition-transform duration-300" />
                        )}
                      </div>
                      <span className={clsx(
                        "font-medium transition-colors duration-300",
                        isGrammarCheckExpanded ? "text-blue-800" : "text-gray-700"
                      )}>Grammar Check</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isGrammarCheckExpanded ? (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full scale-fade-in">Active</span>
                      ) : (
                        <span className="text-xs text-gray-500 hidden sm:inline reveal-right">Check grammar, spelling & style</span>
                      )}
                      <span className={clsx(
                        "text-sm transition-transform duration-300", 
                        isGrammarCheckExpanded ? "text-blue-600 rotate-180" : "text-gray-500"
                      )}>
                        ▼
                      </span>
                    </div>
                  </button>
                  
                  {/* First-time user tooltip */}
                  {showGrammarTooltip && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-64 bg-blue-800 text-white p-3 rounded-lg shadow-lg z-10 animate-fade-in">
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-800 rotate-45"></div>
                      <p className="text-xs font-medium text-center text-appear">
                        <span className="font-bold">Grammar Check</span> analyzes your writing for grammar, spelling, and style issues!
                      </p>
                    </div>
                  )}
                </div>
                
                {isGrammarCheckExpanded && (
                  <div className="max-h-64 overflow-y-auto border-t border-blue-200 bg-white slide-up-fade">
                    <div className="p-4">
                      <div className="max-w-4xl mx-auto">
                        <GrammarCheck 
                          content={content}
                          onApplySuggestion={handleGrammarSuggestion}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Sidebar - Desktop Only */}
        {showAIInsights && !isMobile && note && !note.isEncrypted && (
          <div className="w-1/3 border-l border-gray-200 bg-gray-50 overflow-hidden slide-in-right">
            <AIInsights
              note={{
                ...note,
                title: title,
                content: content
              }}
              allNotes={allNotes}
              isVisible={showAIInsights}
              onClose={() => setShowAIInsights(false)}
              isMobile={false}
            />
          </div>
        )}
      </div>        
      
      {/* Mobile AI Insights Modal with Enhanced Animation */}
      {note && !note.isEncrypted && (
        <div 
          className={`fixed inset-0 z-50 flex items-end md:items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${showAIInsights && isMobile ? 'opacity-100 visible backdrop-fade-in' : 'opacity-0 invisible pointer-events-none'}
          `}
        >            
          <div 
            className={`w-full md:w-96 md:mx-auto bg-white rounded-t-2xl md:rounded-xl max-h-[85vh] md:max-h-[70vh] 
              shadow-xl mobile-safe-area transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col
              ${showAIInsights && isMobile ? 'translate-y-0 slide-in-bottom' : 'translate-y-full'}
            `}
          >
            <div className="flex flex-col items-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-1"></div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 fade-in">
              <div className="flex items-center gap-2 reveal-left">
                <Brain size={18} className="text-purple-600 animate-pulse" />
                <h3 className="font-semibold text-gray-800">AI Insights</h3>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-300 mobile-no-tap-highlight button-pop"
                aria-label="Close AI insights"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden scrollable-container fade-in">
              <AIInsights
                note={{
                  ...note,
                  title: title,
                  content: content
                }}
                allNotes={allNotes}
                isVisible={showAIInsights && isMobile}
                onClose={() => setShowAIInsights(false)}
                isMobile={true}
              />
            </div>
            
            {/* Modal Footer with Refresh Button */}
            {!note.isEncrypted && showAIInsights && (
              <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 gradient-shift slide-up-fade">
                <button
                  onClick={() => {
                    // Find AIInsights instance and call generateInsights
                    // For now we'll just close the modal
                    setShowAIInsights(false);
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-300 mobile-no-tap-highlight transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-md button-pop"
                >
                  <span className="font-medium">Close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Status Bar */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 slide-up-fade">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <span className="truncate reveal-left stagger-1">
              {content.replace(/<[^>]*>/g, '').length} chars
            </span>
            <span className="truncate reveal-left stagger-2">
              {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            {aiTermsCount > 0 && (
              <span className="flex items-center gap-1 truncate reveal-left stagger-3">
                <Sparkles size={12} className="text-purple-500 animate-gentle-bounce" />
                <span className="hidden sm:inline">{aiTermsCount} AI terms</span>
                <span className="sm:hidden">{aiTermsCount}</span>
              </span>
            )}
            {note && (
              <span className="hidden md:block truncate reveal-left stagger-4">
                Last: {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(note.updatedAt)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasChanges && (
              <span className="text-orange-500 flex items-center gap-1 scale-fade-in">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Unsaved</span>
              </span>
            )}
            
            {showAIInsights && !isMobile && (
              <span className="text-purple-600 flex items-center gap-1 scale-fade-in stagger-1">
                <Brain size={12} className="animate-gentle-bounce" />
                <span className="hidden sm:inline">AI Active</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Encryption Modal */}
      {showEncryptionModal && (
        <EncryptionModal
          onClose={() => setShowEncryptionModal(false)}
          note={note}
          onSave={handleEncryptionSuccess}
        />
      )}
    </div>
  );
};
