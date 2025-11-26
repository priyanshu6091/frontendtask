import React from 'react';
import type { Note } from '../types';
import { Pin, Trash2, Lock } from 'lucide-react';
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'group px-4 py-3 cursor-pointer transition-colors mobile-no-tap-highlight border-l-2',
        isSelected
          ? 'bg-white border-l-gray-900'
          : 'bg-transparent border-l-transparent hover:bg-white hover:border-l-gray-300'
      )}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className={clsx(
            'text-sm font-medium text-gray-900 truncate leading-tight',
            isSelected && 'font-semibold'
          )}>
            {note.title || 'Untitled'}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{formatDate(note.updatedAt)}</span>

            {note.isEncrypted && (
              <div className="flex items-center gap-0.5">
                <Lock size={10} />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePinClick}
            className={clsx(
              'p-1 rounded transition-colors mobile-no-tap-highlight',
              note.isPinned
                ? 'text-gray-700'
                : 'text-gray-400 hover:text-gray-700'
            )}
            aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={14} className={note.isPinned ? 'fill-current' : ''} strokeWidth={1.5} />
          </button>

          <button
            onClick={handleDeleteClick}
            className="p-1 rounded hover:text-red-600 text-gray-400 transition-colors mobile-no-tap-highlight"
            aria-label="Delete note"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && !note.isEncrypted && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-1.5 py-0.5 text-xs text-gray-600 bg-gray-100 rounded"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};