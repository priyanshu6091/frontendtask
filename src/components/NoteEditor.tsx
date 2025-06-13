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
  X
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
    } else {
      setTitle('');
      setContent('');
      lastSavedContentRef.current = '';
      lastSavedTitleRef.current = '';
      setHasChanges(false);
      setIsEditing(true); // Start in edit mode for new notes
    }
  }, [note?.id]);

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
    }
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
          <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors mobile-no-tap-highlight"
              aria-label="Back to notes"
            >
              <ArrowLeft size={20} />
            </button>
            
            <h1 className="font-semibold text-gray-800 truncate flex-1 mx-3">
              {title || 'Untitled Note'}
            </h1>
            
            <div className="flex items-center gap-1">
              {note && (
                <button
                  onClick={() => onPin(note.id)}
                  className={clsx(
                    'p-2 rounded-full transition-colors mobile-no-tap-highlight',
                    note.isPinned
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-400 hover:bg-gray-100 active:bg-gray-200'
                  )}
                  aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                >
                  <Pin size={18} className={note.isPinned ? 'fill-current' : ''} />
                </button>
              )}
              
              {enableAIInsights && !note?.isEncrypted && (
                <button
                  onClick={() => setShowAIInsights(true)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Brain size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          // Desktop Header
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Note"
                  className="text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0"
                />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {enableAIInsights && !note?.isEncrypted && (
                  <button
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    className={clsx(
                      'p-2 rounded-full sm:rounded-lg transition-colors mobile-no-tap-highlight',
                      showAIInsights
                        ? 'bg-purple-100 text-purple-600'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    )}
                    aria-label={showAIInsights ? "Hide AI insights" : "Show AI insights"}
                    title={showAIInsights ? "Hide AI insights" : "Show AI insights"}
                  >
                    <Brain size={isMobile ? 20 : 18} />
                  </button>
                )}

                {note && (
                  <>
                    <button
                      onClick={() => setShowEncryptionModal(true)}
                      className={clsx(
                        'p-2 rounded-full sm:rounded-lg transition-colors mobile-no-tap-highlight',
                        note.isEncrypted
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                      )}
                      aria-label={note.isEncrypted ? "Unlock note" : "Lock note"}
                      title={note.isEncrypted ? "Unlock note" : "Lock note"}
                    >
                      {note.isEncrypted ? <Unlock size={isMobile ? 20 : 18} /> : <Lock size={isMobile ? 20 : 18} />}
                    </button>

                    <button
                      onClick={() => onPin(note.id)}
                      className={clsx(
                        'p-2 rounded-full sm:rounded-lg transition-colors mobile-no-tap-highlight',
                        note.isPinned
                          ? 'text-yellow-600 bg-yellow-50'
                          : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                      )}
                      aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                      title={note.isPinned ? "Unpin note" : "Pin note"}
                    >
                      <Pin size={isMobile ? 20 : 18} className={note.isPinned ? 'fill-current' : ''} />
                    </button>

                    <button
                      onClick={() => onDelete(note.id)}
                      className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-full sm:rounded-lg transition-colors mobile-no-tap-highlight"
                      aria-label="Delete note"
                      title="Delete note"
                    >
                      <Trash2 size={isMobile ? 20 : 18} />
                    </button>
                  </>
                )}

                {isMobile ? (
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                      'p-2 rounded-full transition-colors mobile-no-tap-highlight',
                      hasChanges
                        ? 'bg-blue-600 text-white active:bg-blue-700'
                        : 'bg-gray-200 text-gray-500'
                    )}
                    aria-label="Save note"
                    title="Save note"
                  >
                    <Save size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                      'px-4 py-2 rounded-lg font-medium transition-colors flex items-center',
                      hasChanges
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    <Save size={16} className="mr-2" />
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
          'flex flex-col overflow-hidden transition-all duration-300',
          showAIInsights && !isMobile ? 'w-2/3' : 'w-full'
        )}>
          {/* Mobile Title Input */}
          {isMobile && (
            <div className="px-4 py-3 border-b border-gray-200">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full text-xl font-semibold bg-transparent border-none outline-none"
              />
            </div>
          )}          {/* Content Area - Smart Inline Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }} ref={editorRef}>
              <div className="p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                  {!isEditing && content && !note?.isEncrypted ? (
                    // View mode with glossary highlighting
                    <div 
                      className="prose prose-sm md:prose-lg max-w-none cursor-text min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg"
                      onClick={() => setIsEditing(true)}
                    >
                      <GlossaryHighlighter content={content} />
                    </div>
                  ) : !isEditing && !content && !note?.isEncrypted ? (
                    // Empty state
                    <div 
                      className="cursor-text min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 italic"
                      onClick={() => setIsEditing(true)}
                    >
                      Click to start writing your note...
                    </div>
                  ) : note?.isEncrypted ? (
                    // Encrypted state
                    <div className="min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 italic">
                      🔒 This note is encrypted. Click unlock to view content.
                    </div>
                  ) : (
                    // Edit mode with rich text editor
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Start writing your note..."
                      className="min-h-[400px] md:min-h-[500px]"
                      onFocus={() => setIsEditing(true)}
                      onBlur={() => setIsEditing(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grammar Check - Expandable Section */}
            {enableGrammarCheck && content && !note?.isEncrypted && (
              <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsGrammarCheckExpanded(!isGrammarCheckExpanded)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Grammar Check</span>
                  <span className="text-gray-500">
                    {isGrammarCheckExpanded ? '▲' : '▼'}
                  </span>
                </button>
                
                {isGrammarCheckExpanded && (
                  <div className="max-h-48 overflow-y-auto border-t border-gray-200">
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
          <div className="w-1/3 border-l border-gray-200 bg-gray-50 overflow-hidden">
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
      </div>        {/* Mobile AI Insights Modal with Enhanced Animation */}
      {note && !note.isEncrypted && (
        <div 
          className={`fixed inset-0 z-50 flex items-end md:items-center transition-opacity duration-300
            ${showAIInsights && isMobile ? 'opacity-100 visible backdrop-fade-in' : 'opacity-0 invisible pointer-events-none'}
          `}
        >            <div 
            className={`w-full md:w-96 md:mx-auto bg-white rounded-t-2xl md:rounded-xl max-h-[85vh] md:max-h-[70vh] 
              shadow-xl mobile-safe-area transition-transform duration-300 flex flex-col
              ${showAIInsights && isMobile ? 'translate-y-0 slide-in-bottom' : 'translate-y-full'}
            `}
          >
            <div className="flex flex-col items-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-1"></div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800">AI Insights</h3>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors mobile-no-tap-highlight"
                aria-label="Close AI insights"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden scrollable-container">
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
              <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 animate-fade-in">
                <button
                  onClick={() => {
                    // Find AIInsights instance and call generateInsights
                    // For now we'll just close the modal
                    setShowAIInsights(false);
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-300 mobile-no-tap-highlight transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="font-medium">Close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Status Bar */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <span className="truncate">
              {content.replace(/<[^>]*>/g, '').length} chars
            </span>
            <span className="truncate">
              {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            {aiTermsCount > 0 && (
              <span className="flex items-center gap-1 truncate">
                <Sparkles size={12} className="text-purple-500" />
                <span className="hidden sm:inline">{aiTermsCount} AI terms</span>
                <span className="sm:hidden">{aiTermsCount}</span>
              </span>
            )}
            {note && (
              <span className="hidden md:block truncate">
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
              <span className="text-orange-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Unsaved</span>
              </span>
            )}
            
            {showAIInsights && !isMobile && (
              <span className="text-purple-600 flex items-center gap-1">
                <Brain size={12} />
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
