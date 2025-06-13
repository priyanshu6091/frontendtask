import React, { useState } from 'react';
import type { Note } from '../types';
import { NoteCard } from './NoteCard';
import { Search, Plus, StickyNote, Filter } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
  onCreateNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onPinNote: (id: string) => void;
  selectedNoteId?: string;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onPinNote,
  selectedNoteId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = !searchTerm || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.replace(/<[^>]*>/g, '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = !showPinnedOnly || note.isPinned;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Pinned notes first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by update date (most recent first)
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const pinnedCount = notes.filter(note => note.isPinned).length;

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            <span className="text-sm text-gray-500">({notes.length})</span>
          </div>
          
          <button
            onClick={onCreateNote}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm"
            title="Create new note"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showPinnedOnly 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter size={14} />
            <span>Pinned</span>
            {pinnedCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                showPinnedOnly ? 'bg-yellow-200' : 'bg-gray-200'
              }`}>
                {pinnedCount}
              </span>
            )}
          </button>
          
          {/* Welcome Note Quick Access */}
          {notes.find(note => note.id === 'welcome-note') && (
            <button
              onClick={() => {
                const welcomeNote = notes.find(note => note.id === 'welcome-note');
                if (welcomeNote) onEditNote(welcomeNote);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 hover:from-purple-200 hover:to-blue-200 border border-purple-200"
              title="Open Welcome Note"
            >
              ✨ Welcome
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm || showPinnedOnly ? (
              <div>
                <Search className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500 mb-2">No notes found</p>
                <p className="text-gray-400 text-sm">
                  {searchTerm ? 'Try adjusting your search terms' : 'No pinned notes available'}
                </p>
              </div>
            ) : (
              <div>
                <StickyNote className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500 mb-2">No notes yet</p>
                <p className="text-gray-400 text-sm mb-4">Create your first note to get started</p>
                <button
                  onClick={onCreateNote}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Note
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onPin={onPinNote}
                isSelected={note.id === selectedNoteId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {filteredNotes.length} of {notes.length} notes
          {pinnedCount > 0 && ` • ${pinnedCount} pinned`}
        </div>
      </div>
    </div>
  );
};
