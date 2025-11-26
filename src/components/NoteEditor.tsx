import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Note } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { GlossaryHighlighter } from './GlossaryHighlighter';
import { AIInsights } from './AIInsights';
import { GrammarCheck } from './GrammarCheck';
import { EncryptionModal } from './EncryptionModal';
import { TagSuggestions } from './TagSuggestions';
import { TranslationModal } from './TranslationModal';
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
  Edit3,
  Eye,
  PencilLine,
  Languages,
  Loader2
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
  const [tags, setTags] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [isGrammarCheckExpanded, setIsGrammarCheckExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInsightTooltip, setShowInsightTooltip] = useState(false);
  const [showGrammarTooltip, setShowGrammarTooltip] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedContentRef = useRef('');
  const lastSavedTitleRef = useRef('');

  // Initialize note content
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.isEncrypted ? '🔒 This note is encrypted. Click unlock to view content.' : note.content);
      setTags(note.tags || []);
      lastSavedContentRef.current = note.content;
      lastSavedTitleRef.current = note.title;
      setHasChanges(false);

      // New notes with content start in view mode, empty notes start in edit mode
      const hasContent = note.content && note.content.trim().length > 0;
      setIsEditing(!hasContent || note.isEncrypted || false);

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

      // Show edit/view mode tooltip for first time users
      const hasSeenEditViewTooltip = localStorage.getItem('hasSeenEditViewTooltip');
      if (!hasSeenEditViewTooltip && !note.isEncrypted && hasContent) {
        // Set a flag to show the tooltip later
        setTimeout(() => {
          // Briefly highlight the edit/view toggle after other tooltips
          const editViewButtons = document.querySelectorAll('.edit-view-toggle');
          editViewButtons.forEach(btn => {
            btn.classList.add('pulse-animation');
            setTimeout(() => btn.classList.remove('pulse-animation'), 3000);
          });
          localStorage.setItem('hasSeenEditViewTooltip', 'true');
        }, 7000);
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
    onSwipeRight: isMobile ? () => handleClose() : undefined,
    onLongPress: isMobile && enableAIInsights ? () => setShowAIInsights(true) : undefined,
  });

  // Auto-generate title and close the note
  const handleClose = async () => {
    // Check if we need to auto-generate a title
    const needsTitle = (!title || title.trim() === '' || title === 'Untitled Note') && 
                       content && 
                       content.trim().length > 10 && 
                       !note?.isEncrypted;

    if (needsTitle && !isGeneratingTitle) {
      setIsGeneratingTitle(true);
      try {
        const aiService = AIService.getInstance();
        const generatedTitle = await aiService.generateTitle(content);
        if (generatedTitle && generatedTitle !== 'Untitled Note') {
          // Save with the generated title
          const noteData: Partial<Note> = {
            id: note?.id,
            title: generatedTitle,
            content: content,
            tags: tags,
            isPinned: note?.isPinned || false,
            isEncrypted: note?.isEncrypted,
            encryptionData: note?.encryptionData,
          };
          onSave(noteData);
        }
      } catch (error) {
        console.error('Error generating title:', error);
      } finally {
        setIsGeneratingTitle(false);
      }
    }

    // Close the editor
    onClose();
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;

    const noteData: Partial<Note> = {
      id: note?.id,
      title: title || 'Untitled Note',
      content: content,
      tags: tags,
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
          <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors mobile-no-tap-highlight"
              aria-label="Back to notes"
            >
              <ArrowLeft size={18} />
            </button>

            <h1 className="font-semibold text-gray-800 truncate flex-1 mx-3 reveal-left">
              {title || 'Untitled Note'}
            </h1>

            <div className="flex items-center gap-1 slide-up-fade stagger-2">
              {note && (
                <button
                  onClick={() => onPin(note.id)}
                  className={clsx(
                    'p-1.5 rounded transition-colors mobile-no-tap-highlight',
                    note.isPinned
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                >
                  <Pin size={16} className={note.isPinned ? 'fill-current' : ''} strokeWidth={1.5} />
                </button>
              )}

              {/* Edit/View Toggle for mobile */}
              {note && !note.isEncrypted && content && (
                <div className="flex border border-gray-200 rounded-lg overflow-hidden button-pop edit-view-toggle relative">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={clsx(
                      'px-2 py-1 flex items-center gap-1 text-xs transition-all duration-300',
                      !isEditing
                        ? 'bg-blue-50 text-blue-600 font-medium shadow-inner'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Eye size={14} className={!isEditing ? 'animate-quick-pulse' : ''} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={clsx(
                      'px-2 py-1 flex items-center gap-1 text-xs transition-all duration-300',
                      isEditing
                        ? 'bg-blue-50 text-blue-600 font-medium shadow-inner'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <PencilLine size={14} className={isEditing ? 'animate-quick-pulse' : ''} />
                    <span>Edit</span>
                  </button>

                  {/* First-time user tooltip for mobile that appears when localStorage flag is set */}
                  {localStorage.getItem('hasSeenEditViewTooltip') === 'true' &&
                    localStorage.getItem('hasSeenEditViewTooltipMobile') !== 'true' && (
                      <div className="absolute -bottom-20 left-0 w-48 bg-blue-800 text-white p-2 rounded-lg shadow-lg z-10 animate-fade-in">
                        {/* <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-800 transform rotate-45"></div> */}
                        <p className="text-xs font-medium">
                          New! Switch between view and edit modes
                        </p>
                        <button
                          onClick={() => {
                            localStorage.setItem('hasSeenEditViewTooltipMobile', 'true');
                            // Force re-render by updating state
                            setHasChanges(prev => prev);
                          }}
                          className="mt-1 px-2 py-0.5 bg-white text-blue-800 rounded text-xs font-medium"
                        >
                          Got it
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Encryption button for mobile */}
              {note && (
                <button
                  onClick={() => setShowEncryptionModal(true)}
                  className={clsx(
                    'p-2 rounded-lg transition-all duration-300 mobile-no-tap-highlight button-pop flex items-center gap-1.5',
                    note.isEncrypted
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  )}
                  aria-label={note.isEncrypted ? "Unlock note" : "Lock note"}
                >
                  {note.isEncrypted ?
                    <Unlock size={16} className="transition-transform duration-300" /> :
                    <Lock size={16} className="transition-transform duration-300" />
                  }
                  <span className="text-xs font-medium">{note.isEncrypted ? "Decrypt" : "Encrypt"}</span>
                </button>
              )}

              {/* Translation Button - Mobile */}
              {!note?.isEncrypted && content && (
                <button
                  onClick={() => setShowTranslationModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 flex items-center gap-1.5 button-pop"
                  title="Translate note"
                >
                  <Languages size={16} className="transition-transform duration-300" />
                  <span className="text-xs font-medium">Translate</span>
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
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 button-pop"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled Note (auto-generated on close)"
                    className="text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0 focus-border"
                  />
                  
                  {/* Auto-generating indicator */}
                  {isGeneratingTitle && (
                    <div className="flex items-center gap-1.5 text-sm text-purple-600">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="hidden lg:inline">Generating title...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 slide-up-fade">
                {/* Edit/View Toggle for Desktop */}
                {note && !note.isEncrypted && content && (
                  <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden button-pop shadow-sm edit-view-toggle relative">
                    <button
                      onClick={() => setIsEditing(false)}
                      className={clsx(
                        'px-3 py-2 flex items-center gap-1.5 text-sm transition-all duration-300',
                        !isEditing
                          ? 'bg-blue-50 text-blue-600 font-medium shadow-inner'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                      title="Switch to view mode (read-only with term highlights)"
                    >
                      <Eye size={16} className={!isEditing ? 'animate-quick-pulse' : ''} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={clsx(
                        'px-3 py-2 flex items-center gap-1.5 text-sm transition-all duration-300',
                        isEditing
                          ? 'bg-blue-50 text-blue-600 font-medium shadow-inner'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                      title="Switch to edit mode (make changes to note)"
                    >
                      <PencilLine size={16} className={isEditing ? 'animate-quick-pulse' : ''} />
                      <span>Edit</span>
                    </button>

                    {/* First-time user tooltip that appears when localStorage flag is set */}
                    {localStorage.getItem('hasSeenEditViewTooltip') === 'true' &&
                      localStorage.getItem('hasSeenEditViewTooltipExtended') !== 'true' && (
                        <div className="absolute top-full mt-2 right-0 w-64 bg-blue-800 text-white p-3 rounded-lg shadow-lg z-10 animate-fade-in">
                          <div className="absolute -top-2 right-4 w-4 h-4 bg-blue-800 transform rotate-45"></div>
                          <p className="text-xs font-medium text-appear">
                            <span className="font-bold">New!</span> Toggle between <span className="font-bold">View</span> and <span className="font-bold">Edit</span> modes to read or modify your notes.
                          </p>
                          <button
                            onClick={() => {
                              localStorage.setItem('hasSeenEditViewTooltipExtended', 'true');
                              // Force re-render by updating state
                              setHasChanges(prev => prev);
                            }}
                            className="mt-2 px-2 py-1 bg-white text-blue-800 rounded text-xs font-medium hover:bg-blue-50"
                          >
                            Got it
                          </button>
                        </div>
                      )}
                  </div>
                )}

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

                {/* Translation Button - Desktop */}
                {!note?.isEncrypted && content && (
                  <button
                    onClick={() => setShowTranslationModal(true)}
                    className="p-2 sm:px-3 rounded-full sm:rounded-lg transition-all duration-300 mobile-no-tap-highlight flex items-center gap-2 button-pop text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 hover:border hover:border-blue-200"
                    aria-label="Translate note"
                    title="Translate note to another language"
                  >
                    <Languages size={isMobile ? 20 : 18} className="transition-transform duration-300 hover:scale-110" />
                    <span className="hidden sm:inline text-sm font-medium">Translate</span>
                  </button>
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
                      'px-3 py-1.5 rounded text-xs font-medium transition-colors mobile-no-tap-highlight',
                      hasChanges
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-200 text-gray-500'
                    )}
                    aria-label="Save note"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                      'px-4 py-1.5 rounded text-sm font-medium transition-colors',
                      hasChanges
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    )}
                  >
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
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title (auto-generated)..."
                  className="flex-1 text-xl font-semibold bg-transparent border-none outline-none focus-border"
                />
                {/* Auto-generating indicator - Mobile */}
                {isGeneratingTitle && (
                  <div className="p-2 text-purple-600">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Content Area - Smart Inline Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }} ref={editorRef}>
              <div className="p-4 md:p-6 fade-in">
                <div className="max-w-4xl mx-auto slide-up-fade">
                  <div className="transition-all duration-300">
                    {note?.isEncrypted ? (
                      // Encrypted state
                      <div className="min-h-[400px] md:min-h-[500px] p-4 border border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 italic transition-all duration-300">
                        <div className="text-6xl mb-4 float-in">🔒</div>
                        <p className="text-appear">This note is encrypted. Click unlock to view content.</p>
                      </div>
                    ) : !isEditing ? (
                      // View mode with glossary highlighting
                      <>
                        <div
                          className={clsx(
                            "prose prose-sm md:prose-lg max-w-none transition-all duration-300 min-h-[400px] md:min-h-[500px] p-4 border rounded-lg",
                            !content ? "flex items-center justify-center text-gray-500 italic" : "",
                            "border-gray-300 hover:border-blue-300 focus-border bg-gray-50/30",
                            "slide-up-fade"
                          )}
                          onClick={() => setIsEditing(true)}
                        >
                          <div className="fade-in">
                            {content ? (
                              <GlossaryHighlighter content={content} />
                            ) : (
                              <span className="typewriter">Click to start writing your note...</span>
                            )}
                          </div>
                        </div>

                        {/* Display Tags in View Mode - Read Only */}
                        {tags.length > 0 && (
                          <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-700">Tags:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 shadow-sm"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      // Edit mode with rich text editor
                      <div className="slide-up-fade">
                        <RichTextEditor
                          content={content}
                          onChange={setContent}
                          placeholder="Start writing your note..."
                          className="min-h-[400px] md:min-h-[500px] focus-border"
                          onFocus={() => { }} // Don't automatically switch mode on focus anymore
                          onBlur={() => { }} // Don't automatically switch mode on blur anymore
                        />

                        {/* AI Tag Suggestions - Only show in edit mode */}
                        {!note?.isEncrypted && (
                          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <TagSuggestions
                              content={content}
                              title={title}
                              currentTags={tags}
                              onTagsUpdate={setTags}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
            {!note?.isEncrypted && (
              <span className={clsx(
                "scale-fade-in",
                isEditing ? "text-blue-500" : "text-green-600"
              )}>
                <span className="font-medium">{isEditing ? "Editing" : "Viewing"}</span>
              </span>
            )}

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

      {/* Translation Modal */}
      {showTranslationModal && (
        <TranslationModal
          isOpen={showTranslationModal}
          onClose={() => setShowTranslationModal(false)}
          content={content}
          title={title}
          onReplaceContent={(newContent) => {
            setContent(newContent);
            setHasChanges(true);
          }}
        />
      )}

      {/* Mobile Save Button - Only show if there are changes */}
      {isMobile && note && hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            className="p-4 bg-blue-600 text-white rounded-full shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300 mobile-no-tap-highlight button-pop"
            aria-label="Save note"
          >
            <Save size={24} className="animate-pulse" />
          </button>
        </div>
      )}
    </div>
  );
};
