import { useState, useEffect } from 'react';
import type { Note } from './types';
import { useNotes } from './hooks/useNotes';
import { useUserPreferences } from './hooks/useUserPreferences';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
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

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 overflow-hidden mobile-safe-area">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mobile-no-tap-highlight"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <StickyNote className="text-white" size={isMobile ? 18 : 20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Smart Notes</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles size={16} className="text-purple-500" />
          <span className="hidden sm:inline">AI-Powered Glossary</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar with Enhanced Animation */}
        <div className={`
          ${isMobile ? 'fixed inset-y-16 left-0 z-40 h-[calc(100%-4rem)]' : 'relative'}
          ${isMobile ? 'w-[85%] max-w-sm' : 'w-80'}
          ${isSidebarOpen 
            ? isMobile ? 'translate-x-0 slide-in-left' : 'translate-x-0' 
            : '-translate-x-full slide-out-left'
          }
          transition-all-smooth
          bg-white shadow-lg mobile-swipeable
          ${isMobile ? 'border-r border-gray-200' : ''}
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

        {/* Mobile Overlay with Enhanced Animation */}
        {isMobile && (
          <div 
            className={`fixed inset-0 z-30 transition-opacity duration-300 ease-in-out
              ${isSidebarOpen ? 'opacity-100 backdrop-fade-in visible' : 'opacity-0 invisible'}
            `}
            onClick={handleCloseSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
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
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50/30 p-6">
              <div className="max-w-md w-full text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl inline-flex mb-6 shadow-lg">
                  <StickyNote className="text-white" size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Smart Notes</h1>
                <p className="text-gray-600 mb-8">
                  Your AI-powered digital workspace for organized thoughts, intelligent insights, and enhanced productivity.
                </p>
                <button
                  onClick={handleCreateNote}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                >
                  <StickyNote size={20} />
                  Create Your First Note
                </button>
                <div className="mt-12 flex flex-wrap gap-4 justify-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Sparkles size={18} className="text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">AI-Powered Insights</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-full">
                      <StickyNote size={18} className="text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Rich Text Editing</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Variable Warning */}
      {!import.meta.env.VITE_GROQ_API_KEY && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 max-w-sm shadow-lg">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">AI Features Disabled</p>
              <p className="text-yellow-700">Add VITE_GROQ_API_KEY to enable glossary highlighting</p>
            </div>
          </div>
        </div>
      )}

      {/* No welcome toast in this version */}
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
    
    if (errors.length > 0) {
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.type.toUpperCase()}: "${error.text}"`);
        console.log(`     Message: ${error.message}`);
        console.log(`     Suggestions: ${error.suggestions.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('❓ No errors detected - this might indicate an issue with the API or detection logic');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n✅ Simple grammar checker test completed!');
};

// Test API availability
const testAPIAvailability = () => {
  console.log('🔑 API Key available:', !!import.meta.env.VITE_GROQ_API_KEY);
  console.log('🔑 API Key length:', import.meta.env.VITE_GROQ_API_KEY?.length || 0);
  console.log('🔑 API Key prefix:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');
};

// Make test functions available globally
(window as any).testGrammarChecker = testGrammarChecker;
(window as any).testAPIAvailability = testAPIAvailability;

export default App;
