import React, { useState } from 'react';
import type { Note } from '../types';
import { NoteCard } from './NoteCard';
import { Search, Plus, StickyNote } from 'lucide-react';

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

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = !searchTerm ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.replace(/<[^>]*>/g, '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      // Pinned notes first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then by update date (most recent first)
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Minimal Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">All Notes</h2>

          <button
            onClick={onCreateNote}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors mobile-no-tap-highlight"
            title="New note"
            aria-label="Create new note"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Search Bar - Minimal */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-400 mobile-no-tap-highlight bg-white"
            aria-label="Search notes"
          />
        </div>
      </div>

      {/* Notes List - Flat Design */}
      <div className="flex-1 overflow-y-auto mobile-swipeable">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm ? (
              <div>
                <Search className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm text-gray-500">No notes found</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                  <StickyNote className="text-gray-400" size={20} />
                </div>
                <p className="text-sm text-gray-700 mb-1">No notes yet</p>
                <p className="text-xs text-gray-500 mb-4">Create your first note</p>
                <button
                  onClick={onCreateNote}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs rounded transition-colors"
                >
                  New Note
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div className="mb-4">
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pinned</p>
                </div>
                <div>
                  {pinnedNotes.map(note => (
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
              </div>
            )}

            {/* Regular Notes Section */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</p>
                  </div>
                )}
                <div>
                  {unpinnedNotes.map(note => (
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Minimal Footer */}
      {notes.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </div>
        </div>
      )}
    </div>
  );
};
