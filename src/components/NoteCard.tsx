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
        'group p-4 rounded-xl mb-3 cursor-pointer transition-all duration-300 mobile-no-tap-highlight hover-float',
        'border border-gray-200 hover:border-gray-300 sm:hover:shadow-md',
        'active:bg-gray-50 sm:hover:bg-gray-50',
        isSelected && 'bg-blue-50 border-blue-300 shadow-md scale-fade-in',
        note.isPinned && !isSelected && 'bg-yellow-50 border-yellow-200',
        isWelcomeNote && !isSelected && 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100 gradient-shift',
        !isSelected && !isWelcomeNote && 'border border-grow'
      )}
      style={{ animationDelay: `${Math.random() * 0.2}s` }}
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
            note.isPinned && 'text-yellow-800',
            isSelected && 'font-semibold',
          )}>
            {note.title || 'Untitled Note'}
          </h3>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
            <div className="flex items-center gap-1 reveal-left stagger-1">
              <Calendar size={12} className="group-hover:text-blue-500 transition-colors duration-300" />
              <span>{formatDate(note.updatedAt)}</span>
            </div>
            
            <div className="flex items-center gap-1 reveal-left stagger-2">
              <Clock size={12} className="group-hover:text-purple-500 transition-colors duration-300" />
              <span>{calculateReadingTime(note.content)} min read</span>
            </div>
            
            {note.wordCount && (
              <span className="reveal-left stagger-3">{note.wordCount} words</span>
            )}
            
            {note.isEncrypted && (
              <div className="flex items-center gap-1 text-gray-500 reveal-left stagger-3">
                <Lock size={12} className="group-hover:text-green-500 transition-colors duration-300" />
                <span>Encrypted</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - Visible on hover on desktop, always visible on mobile with reduced opacity */}
        <div className="flex items-center gap-1 ml-2 
            sm:opacity-0 sm:group-hover:opacity-100 sm:transition-all sm:duration-300
            opacity-70 touch-action-none">
          <button
            onClick={handlePinClick}
            className={clsx(
              'p-1.5 rounded-full transition-all duration-200 mobile-no-tap-highlight',
              'transform active:scale-90 hover:scale-105',
              note.isPinned 
                ? 'text-yellow-600 bg-yellow-50' 
                : 'text-gray-400 hover:bg-gray-100 active:bg-gray-200'
            )}
            aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={16} className={clsx(
              note.isPinned ? 'fill-current' : '',
              'transition-transform duration-200 group-hover:rotate-12'
            )} />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-full hover:bg-red-50 active:bg-red-100 hover:text-red-600 active:text-red-700 text-gray-400 transition-all duration-200 mobile-no-tap-highlight transform active:scale-90 hover:scale-105"
            aria-label="Delete note"
            title="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content preview */}
      <div className="text-sm text-gray-600 leading-relaxed reveal-left">
        {note.isEncrypted ? (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <Lock size={14} className="animate-pulse" />
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
              className={clsx(
                "inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full transition-all duration-300",
                "hover:bg-gray-200 float-in",
                `stagger-${index + 1}`
              )}
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-gray-400 float-in stagger-4">
              +{note.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Encryption indicator */}
      {note.isEncrypted && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600 float-in stagger-5">
          <span className="w-2 h-2 bg-green-500 rounded-full pulse-animation"></span>
          <span className="font-medium">Encrypted</span>
        </div>
      )}
    </div>
  );
};