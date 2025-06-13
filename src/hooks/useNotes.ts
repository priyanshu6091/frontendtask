import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types';

const STORAGE_KEY = 'notes-app-data';

// No welcome note or sample note data in this version

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
        
        // Filter out any welcome notes that might exist from previous versions
        const filteredNotes = notesWithDates.filter((note: Note) => 
          note.id !== 'welcome-note' && note.id !== 'grammar-test-note'
        );
        
        setNotes(filteredNotes);
      } else {
        // Start with an empty notes array
        setNotes([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
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
