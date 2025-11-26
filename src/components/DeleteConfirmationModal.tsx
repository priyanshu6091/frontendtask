import React, { useState, useRef, useEffect } from 'react';
import type { Note } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { Trash2, Lock, Eye, EyeOff, X, AlertTriangle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface DeleteConfirmationModalProps {
  note: Note;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  note,
  onConfirm,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const isEncrypted = note.isEncrypted;

  // Focus password input for encrypted notes
  useEffect(() => {
    if (isEncrypted && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [isEncrypted]);

  // Clear error when password changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [password]);

  const handleDelete = async () => {
    if (isEncrypted) {
      // Verify password before deleting
      if (!password) {
        setError('Please enter the password to delete this encrypted note');
        return;
      }

      setIsVerifying(true);
      setError(null);

      try {
        const encryptionService = EncryptionService.getInstance();
        
        // Try to decrypt to verify password
        if (note.encryptionData) {
          const { encrypted, salt, iv } = note.encryptionData;
          await encryptionService.decrypt(encrypted, password, salt, iv);
        }
        
        // Password correct, proceed with deletion
        onConfirm();
      } catch (err) {
        setError('Incorrect password. Please try again.');
        setIsVerifying(false);
      }
    } else {
      // Not encrypted, just confirm deletion
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleDelete();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Note</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                This action cannot be undone
              </p>
              <p className="text-sm text-amber-700 mt-1">
                The note "{note.title || 'Untitled'}" will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Password verification for encrypted notes */}
          {isEncrypted && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock size={16} className="text-green-600" />
                <span>This note is encrypted. Enter password to confirm deletion.</span>
              </div>

              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter encryption password"
                  className={clsx(
                    "w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    error 
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                      : "border-gray-300 focus:ring-red-500 focus:border-red-500"
                  )}
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isVerifying || (isEncrypted && !password)}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2",
              isVerifying || (isEncrypted && !password)
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
