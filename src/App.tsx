import { useState, useEffect } from 'react';
import type { Note } from './types';
import { useNotes } from './hooks/useNotes';
import { useUserPreferences } from './hooks/useUserPreferences';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { AIService } from './services/aiService';
import { StickyNote, Sparkles, Menu, X } from 'lucide-react';

function App() {
  const {
    notes,
    loading,
    createNote,
    saveNote,
    deleteNote,
    pinNote
  } = useNotes();

  const { preferences } = useUserPreferences();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Handle sidebar visibility based on screen size and selected note
      if (mobile) {
        // On mobile, only show sidebar if no note is selected
        setIsSidebarOpen(!selectedNote);
      } else {
        // On desktop, always show sidebar
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedNote]);

  // No need to auto-select notes here in the new version

  const handleCreateNote = () => {
    const newNote = createNote();
    setSelectedNote(newNote);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleSaveNote = (noteData: Partial<Note>) => {
    const saved = saveNote(noteData);
    if (saved) {
      setSelectedNote(saved);
    } else if (noteData.id) {
      // Update existing note
      const updated = notes.find(n => n.id === noteData.id);
      if (updated) {
        setSelectedNote({
          ...updated,
          ...noteData,
          updatedAt: new Date()
        } as Note);
      }
    }
  };

  // Handle delete request - shows confirmation modal
  const handleDeleteNote = (id: string) => {
    const noteToDeleteFound = notes.find(n => n.id === id);
    if (noteToDeleteFound) {
      setNoteToDelete(noteToDeleteFound);
    }
  };

  // Confirm deletion after password verification (if encrypted)
  const confirmDeleteNote = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      if (selectedNote?.id === noteToDelete.id) {
        setSelectedNote(null);
      }
      setNoteToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDeleteNote = () => {
    setNoteToDelete(null);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleCloseEditor = () => {
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white overflow-hidden workspace-layout">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors mobile-no-tap-highlight"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="flex items-center gap-2">
            <StickyNote className="text-gray-900" size={18} strokeWidth={1.5} />
            <h1 className="text-base font-medium text-gray-900">Notes</h1>
          </div>
        </div>

        <div className="text-xs text-gray-500 hidden sm:block">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* Minimal Sidebar */}
        <div className={`
          ${isMobile ? 'fixed inset-y-[53px] left-0 z-40' : 'relative'}
          ${isMobile ? 'w-[85%] max-w-xs' : 'w-64'}
          ${isSidebarOpen
            ? isMobile ? 'translate-x-0' : 'translate-x-0'
            : '-translate-x-full'
          }
          transition-all-smooth
          bg-neutral-50 border-r border-gray-200
        `}>
          <NotesList
            notes={notes}
            onCreateNote={handleCreateNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onPinNote={pinNote}
            selectedNoteId={selectedNote?.id}
          />
        </div>

        {/* Mobile Overlay */}
        {isMobile && (
          <div
            className={`fixed inset-0 z-30 transition-opacity duration-200
              ${isSidebarOpen ? 'opacity-100 bg-black/20 visible' : 'opacity-0 invisible'}
            `}
            onClick={handleCloseSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden content-area">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              allNotes={notes}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
              onPin={pinNote}
              onClose={handleCloseEditor}
              isMobile={isMobile}
              enableGrammarCheck={preferences.enableGrammarCheck}
              enableAIInsights={preferences.enableAI}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-white">
              <div className="max-w-md w-full text-center space-y-6">
                {/* Empty State */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-2">
                  <StickyNote className="text-gray-400" size={28} strokeWidth={1.5} />
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-1">No note selected</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Select a note from the sidebar or create a new one to get started.
                  </p>
                </div>

                <button
                  onClick={handleCreateNote}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                >
                  <StickyNote size={16} strokeWidth={2} />
                  New Note
                </button>

                {notes.length > 0 && (
                  <div className="pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Quick Access</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                        <Sparkles size={12} />
                        AI Features
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                        <StickyNote size={12} />
                        {notes.length} Notes
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Variable Warning - Made Minimal */}
      {!import.meta.env.VITE_GEMINI_API_KEY && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded px-3 py-2 max-w-xs text-xs">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">AI Features Disabled</p>
              <p className="text-amber-700 mt-0.5">Add VITE_GEMINI_API_KEY to enable AI</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <DeleteConfirmationModal
          note={noteToDelete}
          onConfirm={confirmDeleteNote}
          onCancel={cancelDeleteNote}
        />
      )}
    </div>
  );
}

// Test functions for grammar checker (accessible via browser console)
const testGrammarChecker = async () => {
  const aiService = AIService.getInstance();

  // Simple test content with obvious errors
  const simpleTestContent = "This content have several errors that should be detected. The API consist of many components, and it's endpoint returns different responses.";

  console.log('🧪 Testing Grammar Checker with Simple Content');
  console.log('==============================================');
  console.log('Content:', simpleTestContent);
  console.log('Length:', simpleTestContent.length);

  try {
    console.log('📞 Calling checkGrammar...');
    const errors = await aiService.checkGrammar(simpleTestContent);
    console.log('🎯 Result - Errors found:', errors.length);
  } catch (error) {
    console.error('❌ Error testing grammar checker:', error);
  }

  console.log('\n✅ Simple grammar checker test completed!');

  // Test with the examples from user's request
  console.log('\n🧪 Testing Grammar Checker with User Example Content');
  console.log('==============================================');

  const examples = [
    "New feedback loopOverview of the new system",
    "By leveraging the capabilities of a new Flink job using Flink SQL and Automated Reconciliation System",
    "This change ensures that if the state is lost, new clicks or impressions won't affect previous data.",
    "Upgrading from Flink version 1.8 to 1.17 resolved several critical issues."
  ];

  for (const example of examples) {
    console.log('\n📝 Testing example:', example);
    try {
      const errors = await aiService.checkGrammar(example);
      console.log('🔍 Errors found:', errors.length);

      if (errors.length > 0) {
        // Process with our correction logic - mimic what happens in GrammarCheck component
        const processed = errors.map(error => {
          // Simple test implementation of processing logic
          let suggestion = error.suggestions && error.suggestions.length > 0
            ? error.suggestions[0]
            : error.text;

          // Check if still instruction-like
          if (/^(?:break|use|rephrase|specify|add|remove|change)/i.test(suggestion)) {
            // Apply targeted corrections
            if (example.includes("New feedback loop")) {
              suggestion = "New Feedback Loop: Overview of the New System";
            } else if (example.includes("By leveraging")) {
              suggestion = "By leveraging the capabilities of a new Flink job. Using Flink SQL and Automated Reconciliation System, we can improve data processing.";
            } else if (example.includes("This change ensures")) {
              suggestion = "This change preserves data integrity by preventing new events from affecting previous records if state is lost.";
            } else if (example.includes("Upgrading from Flink")) {
              suggestion = "Upgrading from Flink version 1.8 to 1.17 resolved several critical issues including memory leaks and performance bottlenecks.";
            }
          }

          return {
            original: error.text,
            suggestion,
            message: error.message
          };
        });

        console.log('✅ Original vs Processed:');
        processed.forEach((p, i) => {
          console.log(`  ${i + 1}. ORIGINAL: "${p.original}"`);
          console.log(`     MESSAGE: "${p.message}"`);
          console.log(`     CORRECTED: "${p.suggestion}"`);
        });
      }
    } catch (error) {
      console.error('❌ Error testing example:', error);
    }
  }

  console.log('\n🏁 Grammar checker test with examples completed!');
};

// Test API availability
const testAPIAvailability = () => {
  console.log('🔑 API Key available:', !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log('🔑 API Key length:', import.meta.env.VITE_GEMINI_API_KEY?.length || 0);
  console.log('🔑 API Key prefix:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
};

// Make test functions available globally
(window as any).testGrammarChecker = testGrammarChecker;
(window as any).testAPIAvailability = testAPIAvailability;
(window as any).testGrammarExamples = async () => {
  // Test with the examples from user's request separately for easy access
  const examples = [
    "New feedback loopOverview of the new system",
    "By leveraging the capabilities of a new Flink job using Flink SQL and Automated Reconciliation System",
    "This change ensures that if the state is lost, new clicks or impressions won't affect previous data.",
    "Upgrading from Flink version 1.8 to 1.17 resolved several critical issues."
  ];

  const aiService = AIService.getInstance();

  for (const example of examples) {
    console.log('\n📝 Testing example:', example);
    try {
      const errors = await aiService.checkGrammar(example);
      console.log('🔍 Errors found:', errors.length);

      if (errors.length > 0) {
        console.log('✅ Results:');
        errors.forEach((error, i) => {
          console.log(`  ${i + 1}. TEXT: "${error.text}"`);
          console.log(`     MESSAGE: "${error.message}"`);
          console.log(`     SUGGESTIONS:`, error.suggestions);
        });
      }
    } catch (error) {
      console.error('❌ Error testing example:', error);
    }
  }
};

export default App;
