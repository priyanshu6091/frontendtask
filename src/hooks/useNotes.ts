import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types';

const STORAGE_KEY = 'notes-app-data';

// Welcome note data
const createWelcomeNote = (): Note => ({
  id: 'welcome-note',
  title: '🌟 Welcome to Smart Notes - Where Ideas Come Alive!',
  content: `<div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
  <h1 style="margin: 0; font-size: 2.8em; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🚀 Smart Notes</h1>
  <p style="margin: 15px 0 0 0; font-size: 1.3em; opacity: 0.95; font-weight: 300;">Your AI-Powered Digital Brain for the Modern Era</p>
  <p style="margin: 10px 0 0 0; font-size: 1em; opacity: 0.8;">✨ Where Every Note Becomes Smarter ✨</p>
</div>

<div style="background: linear-gradient(145deg, #f8fafc, #e2e8f0); padding: 25px; border-radius: 12px; border: 1px solid #cbd5e1; margin: 20px 0; position: relative;">
  <div style="position: absolute; top: -10px; left: 20px; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em; font-weight: bold;">👋 Hey There!</div>
  <div style="margin-top: 15px;">
    <h3 style="margin-top: 0; color: #1e40af; font-size: 1.4em;">🎯 Ready to Revolutionize Your Note-Taking?</h3>
    <p style="color: #475569; font-size: 1.1em; line-height: 1.6;">
      <strong>Congratulations! You've discovered something extraordinary.</strong> 🎉<br>
      Smart Notes isn't just another note app - it's your personal AI assistant that understands, analyzes, and enhances your thoughts in real-time!
    </p>
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
  <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
    <h4 style="margin-top: 0; color: #92400e;">🧠 AI-Powered Intelligence</h4>
    <p style="color: #78350f; font-size: 0.95em;">Your notes get smarter with AI grammar checking, term definitions, and content insights!</p>
  </div>
  <div style="background: #dcfce7; padding: 20px; border-radius: 10px; border-left: 4px solid #22c55e;">
    <h4 style="margin-top: 0; color: #166534;">🎨 Beautiful & Intuitive</h4>
    <p style="color: #15803d; font-size: 0.95em;">Gorgeous design meets powerful functionality - note-taking has never been this enjoyable!</p>
  </div>
</div>

<h3 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">🚀 What Makes Smart Notes Magical?</h3>

<div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 20px 0;">
  <h4 style="margin-top: 0; color: #7c3aed;">✨ Custom Rich Text Editor</h4>
  <p>Built from scratch with love - no bloated external libraries! Bold, italic, underline, alignment, and more.</p>
  
  <h4 style="color: #db2777;">🤖 AI Grammar Genius</h4>
  <p>Real-time grammar, spelling, and style checking with 5 categories of analysis and confidence scores!</p>
  
  <h4 style="color: #059669;">🔍 Smart Glossary Highlighting</h4>
  <p>Type <em>React</em>, <em>TypeScript</em>, <em>API</em>, or any technical term - watch them turn blue with AI-powered hover definitions!</p>
  
  <h4 style="color: #dc2626;">🔐 Fort Knox Security</h4>
  <p>End-to-end encryption with AES-256-GCM. Your secrets stay secret, always.</p>
</div>

<div style="background: linear-gradient(135deg, #fef3c7, #fed7aa); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px dashed #f59e0b;">
  <h3 style="margin-top: 0; color: #92400e; text-align: center;">🎮 Try This Right Now!</h3>
  <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em; border-left: 4px solid #f59e0b;">
    "This sentence have several error that the AI should detect. The API consist of many component, and it's endpoint return different response."
  </div>
  <p style="color: #78350f; margin-bottom: 10px;"><strong>Copy this text ↑ into a new note and watch the AI work its magic!</strong></p>
  <ol style="color: #78350f;">
    <li>Create a new note with the "+" button</li>
    <li>Paste the text above</li>
    <li>Open the Grammar Check section</li>
    <li>See AI categorize errors by type and suggest fixes!</li>
  </ol>
</div>

<h3 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">⚡ Pro Tips for Power Users</h3>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0;">
  <div style="background: #ede9fe; padding: 15px; border-radius: 8px;">
    <strong style="color: #6b21a8;">⌨️ Keyboard Ninja:</strong>
    <ul style="margin: 10px 0 0 0; color: #7c3aed;">
      <li>Ctrl+B = Bold magic</li>
      <li>Ctrl+I = Italic style</li>
      <li>Ctrl+S = Save instantly</li>
    </ul>
  </div>
  <div style="background: #fce7f3; padding: 15px; border-radius: 8px;">
    <strong style="color: #be185d;">📱 Mobile Master:</strong>
    <ul style="margin: 10px 0 0 0; color: #ec4899;">
      <li>Swipe right to go back</li>
      <li>Long press for AI insights</li>
      <li>Pinch to zoom like a pro</li>
    </ul>
  </div>
</div>

<div style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe); padding: 25px; border-radius: 15px; text-align: center; margin: 30px 0;">
  <h3 style="margin-top: 0; color: #3730a3;">🌟 Ready to Get Started?</h3>
  <p style="color: #4338ca; font-size: 1.1em; margin: 15px 0;">Your journey to smarter note-taking begins now!</p>
  <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
    <span style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold;">1. Create Your First Note</span>
    <span style="background: #10b981; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold;">2. Watch AI Magic Happen</span>
    <span style="background: #f59e0b; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold;">3. Become a Productivity Hero</span>
  </div>
</div>

<div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #64748b;">
  <p style="color: #475569; font-style: italic; margin: 0; text-align: center;">
    💡 <strong>Pro Tip:</strong> Pin this welcome note to keep it handy while you explore all the amazing features!
  </p>
</div>

<hr style="margin: 30px 0; border: none; height: 2px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);">

<p style="text-align: center; color: #64748b; font-size: 0.9em; margin: 20px 0 0 0;">
  <em>Built with ❤️ using React, TypeScript, and cutting-edge AI technology</em><br>
  <strong>Smart Notes - Where every thought becomes extraordinary!</strong>
</p>`,
  isPinned: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample note with grammar errors for testing
const createGrammarTestNote = (): Note => ({
  id: 'grammar-test-note',
  title: '📝 Grammar Checker Demo',
  content: `<h2>Test the Enhanced Grammar Checker</h2>

<p>This note contain several intentional error that the AI should detect and categorize:</p>

<h3>Grammar Errors</h3>
<p>This sentence have subject-verb disagreement. The team were working on the project, but they was not coordinated. Each developer need to follow the guidelines.</p>

<h3>Spelling Mistakes</h3>
<p>The recieve function should handel the response correctly. We need to seperately test each componant to ensure it's functionality.</p>

<h3>Style Issues</h3>
<p>The performance is much more better now. It's very very important to optimize the code. We should avoid redundant redundant phrases.</p>

<h3>Clarity Problems</h3>
<p>When the user clicks the button, it does something that might be important depending on the context which could be different based on various factors.</p>

<h3>Tone Inconsistencies</h3>
<p>This is awesome code! However, the implementation requires careful consideration. LOL, this part is totally broken though.</p>

<p><strong>Instructions:</strong> Expand the Grammar Check section below to see how the AI categorizes these issues by type (Grammar, Spelling, Style, Clarity, Tone) and severity (High, Medium, Low).</p>`,
  isPinned: false,
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
});

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedNotes = JSON.parse(stored);
        // Convert date strings back to Date objects
        const notesWithDates = parsedNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        
        // Always ensure welcome note is present
        const hasWelcomeNote = notesWithDates.some((note: Note) => note.id === 'welcome-note');
        if (!hasWelcomeNote) {
          const welcomeNote = createWelcomeNote();
          const welcomeNoteWithDates = {
            ...welcomeNote,
            createdAt: new Date(welcomeNote.createdAt),
            updatedAt: new Date(welcomeNote.updatedAt)
          };
          notesWithDates.unshift(welcomeNoteWithDates); // Add at beginning
        }
        
        setNotes(notesWithDates);
      } else {
        // Load welcome note and grammar test note for new users
        const welcomeNote = createWelcomeNote();
        const grammarTestNote = createGrammarTestNote();
        const defaultNotes = [welcomeNote, grammarTestNote];
        
        const notesWithDates = defaultNotes.map(note => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        
        setNotes(notesWithDates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNotes));
      }
    } catch (error) {
      console.error('Error loading notes from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (error) {
        console.error('Error saving notes to localStorage:', error);
      }
    }
  }, [notes, loading]);

  const createNote = useCallback((): Note => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      content: '',
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((noteData: Partial<Note> & { id: string }) => {
    setNotes(prev => prev.map(note => 
      note.id === noteData.id 
        ? { 
            ...note, 
            ...noteData, 
            updatedAt: new Date() 
          }
        : note
    ));
  }, []);

  const saveNote = useCallback((noteData: Partial<Note>) => {
    if (noteData.id) {
      // Update existing note
      updateNote(noteData as Partial<Note> & { id: string });
    } else {
      // Create new note
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        isPinned: noteData.isPinned || false,
        createdAt: noteData.createdAt || new Date(),
        updatedAt: new Date()
      };
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    }
  }, [updateNote]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const pinNote = useCallback((id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
        : note
    ));
  }, []);

  const duplicateNote = useCallback((id: string) => {
    const originalNote = notes.find(note => note.id === id);
    if (originalNote) {
      const duplicatedNote: Note = {
        ...originalNote,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${originalNote.title} (Copy)`,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setNotes(prev => [duplicatedNote, ...prev]);
      return duplicatedNote;
    }
  }, [notes]);

  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) return notes;
    
    const lowercaseQuery = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.replace(/<[^>]*>/g, '').toLowerCase().includes(lowercaseQuery)
    );
  }, [notes]);

  const getNotesStats = useCallback(() => {
    return {
      total: notes.length,
      pinned: notes.filter(note => note.isPinned).length,
      recent: notes.filter(note => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return note.updatedAt > dayAgo;
      }).length
    };
  }, [notes]);

  return {
    notes,
    loading,
    createNote,
    updateNote,
    saveNote,
    deleteNote,
    pinNote,
    duplicateNote,
    getNoteById,
    searchNotes,
    getNotesStats
  };
};
