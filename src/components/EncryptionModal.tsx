import React, { useState, useRef, useEffect } from 'react';
import type { Note } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Shield, 
  X, 
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';

interface EncryptionModalProps {
  note: Note | null;
  onClose: () => void;
  onSave: (noteData: Partial<Note>) => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  label: string;
}

export const EncryptionModal: React.FC<EncryptionModalProps> = ({
  note,
  onClose,
  onSave
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  
  const isEncrypting = !note?.isEncrypted;
  const encryptionService = EncryptionService.getInstance();

  // Focus password input when modal opens
  useEffect(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  // Clear messages when password changes
  useEffect(() => {
    if (error || success) {
      setError(null);
      setSuccess(null);
    }
  }, [password, confirmPassword]);

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (pwd.length >= 12) score += 1;
    else if (pwd.length >= 8) feedback.push('12+ characters recommended');

    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    else feedback.push('Include special characters');

    const colors = ['bg-red-400', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

    return {
      score,
      feedback,
      color: colors[score] || colors[0],
      label: labels[score] || labels[0]
    };
  };

  const generatePassword = () => {
    const newPassword = encryptionService.generateSecurePassword(16);
    setGeneratedPassword(newPassword);
    setShowPasswordGenerator(true);
  };

  const useGeneratedPassword = () => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
    setShowPasswordGenerator(false);
    setGeneratedPassword('');
    if (confirmPasswordInputRef.current) {
      confirmPasswordInputRef.current.focus();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Password copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to copy password');
    }
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (isEncrypting) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      const strength = calculatePasswordStrength(password);
      if (strength.score < 3) {
        setError('Password is too weak. Please use a stronger password.');
        return false;
      }
    }

    return true;
  };

  const handleEncrypt = async () => {
    if (!note || !validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create content to encrypt (both title and content)
      const contentToEncrypt = JSON.stringify({
        title: note.title,
        content: note.content
      });

      const encryptionResult = await encryptionService.encrypt(contentToEncrypt, password);

      // Save encrypted note
      onSave({
        ...note,
        title: `🔒 ${note.title}`, // Keep original title visible with lock icon
        content: '🔒 This note is encrypted. Click to decrypt.', // Placeholder content
        isEncrypted: true,
        encryptionData: encryptionResult,
        updatedAt: new Date()
      });

      setSuccess('Note encrypted successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError('Failed to encrypt note. Please try again.');
      console.error('Encryption error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!note || !note.encryptionData || !validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const decryptedContent = await encryptionService.decrypt(
        note.encryptionData.encrypted,
        password,
        note.encryptionData.salt,
        note.encryptionData.iv
      );

      // Parse decrypted content
      const parsedContent = JSON.parse(decryptedContent);

      // Save decrypted note
      onSave({
        ...note,
        title: parsedContent.title,
        content: parsedContent.content,
        isEncrypted: false,
        encryptionData: undefined,
        updatedAt: new Date()
      });

      setSuccess('Note decrypted successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError('Failed to decrypt note. Please check your password.');
      console.error('Decryption error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEncrypting) {
      handleEncrypt();
    } else {
      handleDecrypt();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isEncrypting ? (
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="text-green-600" size={24} />
              </div>
            ) : (
              <div className="p-2 bg-blue-100 rounded-lg">
                <Unlock className="text-blue-600" size={24} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEncrypting ? 'Encrypt Note' : 'Decrypt Note'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEncrypting 
                  ? 'Secure your note with end-to-end encryption' 
                  : 'Enter your password to access this note'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  {isEncrypting ? 'End-to-End Encryption' : 'Secure Decryption'}
                </p>
                <p>
                  {isEncrypting 
                    ? 'Your note will be encrypted using AES-256-GCM with PBKDF2 key derivation (100,000 iterations). Only you can decrypt it with your password.'
                    : 'Enter your password to decrypt this note. Your password is never stored or transmitted.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle size={16} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEncrypting ? 'Create Password' : 'Enter Password'}
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20"
                  placeholder={isEncrypting ? "Enter a strong password" : "Enter your password"}
                  required
                  disabled={isProcessing}
                  autoComplete={isEncrypting ? "new-password" : "current-password"}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    disabled={isProcessing}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {isEncrypting && (
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Generate secure password"
                      disabled={isProcessing}
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password Generator */}
            {showPasswordGenerator && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Generated Password:</span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordGenerator(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                    {generatedPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedPassword)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Copy password"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={useGeneratedPassword}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Use This Password
                </button>
              </div>
            )}

            {/* Confirm Password (only for encryption) */}
            {isEncrypting && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    ref={confirmPasswordInputRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Confirm your password"
                    required
                    disabled={isProcessing}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isProcessing}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Password Strength Indicator (for encryption) */}
            {isEncrypting && password && passwordStrength && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                  <span className={clsx(
                    "text-sm font-medium",
                    passwordStrength.score <= 2 ? "text-red-600" :
                    passwordStrength.score <= 4 ? "text-yellow-600" : "text-green-600"
                  )}>
                    {passwordStrength.label}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "h-2 flex-1 rounded",
                        i < passwordStrength.score ? passwordStrength.color : "bg-gray-200"
                      )}
                    />
                  ))}
                </div>

                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <p className="mb-1">Suggestions:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>{feedback}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Password Match Indicator */}
            {isEncrypting && confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {password === confirmPassword ? (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isProcessing || (isEncrypting && (!password || !confirmPassword || password !== confirmPassword))}
                className={clsx(
                  "flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  isEncrypting 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : isEncrypting ? (
                    <Lock size={18} />
                  ) : (
                    <Unlock size={18} />
                  )}
                  <span>
                    {isProcessing 
                      ? (isEncrypting ? 'Encrypting...' : 'Decrypting...') 
                      : (isEncrypting ? 'Encrypt Note' : 'Decrypt Note')
                    }
                  </span>
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
          <div className="flex items-start gap-3 text-xs text-gray-600">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Security Information:</p>
              <ul className="space-y-1">
                <li>• AES-256-GCM encryption with PBKDF2 key derivation</li>
                <li>• 100,000 iterations for enhanced security</li>
                <li>• Your password is never stored or transmitted</li>
                <li>• Encryption happens entirely in your browser</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};