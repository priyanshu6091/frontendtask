import { useState, useCallback } from 'react';
import { EncryptionService } from '../services/encryptionService';
import type { Note } from '../types';

export interface EncryptionState {
  isEncrypting: boolean;
  isDecrypting: boolean;
  error: string | null;
  success: string | null;
}

export const useEncryption = () => {
  const [encryptionState, setEncryptionState] = useState<EncryptionState>({
    isEncrypting: false,
    isDecrypting: false,
    error: null,
    success: null
  });

  const encryptionService = EncryptionService.getInstance();

  const encryptNote = useCallback(async (note: Note, password: string): Promise<Note | null> => {
    setEncryptionState(prev => ({ ...prev, isEncrypting: true, error: null, success: null }));

    try {
      // Create content to encrypt (both title and content)
      const contentToEncrypt = JSON.stringify({
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category
      });

      const encryptionResult = await encryptionService.encrypt(contentToEncrypt, password);

      // Create encrypted note
      const encryptedNote: Note = {
        ...note,
        title: `🔒 ${note.title}`, // Keep original title visible with lock icon
        content: '🔒 This note is encrypted. Click to decrypt.', // Placeholder content
        isEncrypted: true,
        encryptionData: encryptionResult,
        updatedAt: new Date()
      };

      setEncryptionState(prev => ({ 
        ...prev, 
        isEncrypting: false, 
        success: 'Note encrypted successfully!' 
      }));

      return encryptedNote;

    } catch (error) {
      console.error('Encryption failed:', error);
      setEncryptionState(prev => ({ 
        ...prev, 
        isEncrypting: false, 
        error: 'Failed to encrypt note. Please try again.' 
      }));
      return null;
    }
  }, [encryptionService]);

  const decryptNote = useCallback(async (note: Note, password: string): Promise<Note | null> => {
    if (!note.encryptionData) {
      setEncryptionState(prev => ({ 
        ...prev, 
        error: 'Note encryption data is missing.' 
      }));
      return null;
    }

    setEncryptionState(prev => ({ ...prev, isDecrypting: true, error: null, success: null }));

    try {
      const decryptedContent = await encryptionService.decrypt(
        note.encryptionData.encrypted,
        password,
        note.encryptionData.salt,
        note.encryptionData.iv
      );

      // Parse decrypted content
      const parsedContent = JSON.parse(decryptedContent);

      // Create decrypted note
      const decryptedNote: Note = {
        ...note,
        title: parsedContent.title,
        content: parsedContent.content,
        tags: parsedContent.tags || note.tags,
        category: parsedContent.category || note.category,
        isEncrypted: false,
        encryptionData: undefined,
        updatedAt: new Date()
      };

      setEncryptionState(prev => ({ 
        ...prev, 
        isDecrypting: false, 
        success: 'Note decrypted successfully!' 
      }));

      return decryptedNote;

    } catch (error) {
      console.error('Decryption failed:', error);
      setEncryptionState(prev => ({ 
        ...prev, 
        isDecrypting: false, 
        error: 'Failed to decrypt note. Please check your password.' 
      }));
      return null;
    }
  }, [encryptionService]);

  const validatePassword = useCallback(async (note: Note, password: string): Promise<boolean> => {
    if (!note.encryptionData) return false;

    try {
      return await encryptionService.validatePassword(
        note.encryptionData.encrypted,
        password,
        note.encryptionData.salt,
        note.encryptionData.iv
      );
    } catch (error) {
      console.error('Password validation failed:', error);
      return false;
    }
  }, [encryptionService]);

  const generateSecurePassword = useCallback((length: number = 16): string => {
    return encryptionService.generateSecurePassword(length);
  }, [encryptionService]);

  const clearMessages = useCallback(() => {
    setEncryptionState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  const resetState = useCallback(() => {
    setEncryptionState({
      isEncrypting: false,
      isDecrypting: false,
      error: null,
      success: null
    });
  }, []);

  return {
    encryptionState,
    encryptNote,
    decryptNote,
    validatePassword,
    generateSecurePassword,
    clearMessages,
    resetState
  };
};
