import React from 'react';
import type { Note } from '../types';
import { Pin, Trash2, Calendar, Clock, Lock } from 'lucide-react';
import { clsx } from 'clsx';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  isSelected?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onPin,
  isSelected = false
}) => {
  const handleClick = () => {
    onEdit(note);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPin(note.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  // Check if this is the welcome note
  const isWelcomeNote = note.id === 'welcome-note';

  // Extract plain text from HTML content for preview
  const getPlainTextPreview = (htmlContent: string, maxLength: number = 150) => {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const calculateReadingTime = (content: string) => {
    const words = getPlainTextPreview(content, Infinity).split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words per minute
    return readingTime;
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'group p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50',
        isSelected && 'bg-blue-50 border-blue-200',
        note.isPinned && 'bg-yellow-50 border-yellow-200',
        isWelcomeNote && 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100'
      )}
    >
      {/* Special welcome note indicator */}
      {isWelcomeNote && (
        <div className="flex items-center mb-2">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
            ✨ Welcome Note
          </div>
        </div>
      )}
      
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={clsx(
            'font-medium text-gray-900 truncate',
            note.isPinned && 'text-yellow-800'
          )}>
            {note.title || 'Untitled Note'}
          </h3>
          
          {/* Metadata */}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(note.updatedAt)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{calculateReadingTime(note.content)} min read</span>
            </div>
            
            {note.wordCount && (
              <span>{note.wordCount} words</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePinClick}
            className={clsx(
              'p-1 rounded hover:bg-gray-200 transition-colors',
              note.isPinned ? 'text-yellow-600' : 'text-gray-400'
            )}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={16} className={note.isPinned ? 'fill-current' : ''} />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="p-1 rounded hover:bg-red-100 hover:text-red-600 text-gray-400 transition-colors"
            title="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content preview */}
      <div className="text-sm text-gray-600 leading-relaxed">
        {note.isEncrypted ? (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <Lock size={14} />
            <span>This note is encrypted. Click to decrypt and view.</span>
          </div>
        ) : (
          getPlainTextPreview(note.content) || (
            <span className="italic text-gray-400">No content</span>
          )
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{note.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Encryption indicator */}
      {note.isEncrypted && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Encrypted</span>
        </div>
      )}
    </div>
  );
};