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
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-fade-in" onClick={() => onClose()}>
      <div 
        className="bg-white w-full max-w-md mx-4 rounded-xl shadow-xl border border-gray-200 overflow-hidden scale-fade-in mobile-safe-area"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 float-in">
              {isEncrypting ? (
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg transition-all duration-300">
                  <Lock size={20} className="animate-pulse" />
                </div>
              ) : (
                <div className="p-2 bg-green-100 text-green-600 rounded-lg transition-all duration-300">
                  <Unlock size={20} className="animate-pulse" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-800 reveal-left">
                {isEncrypting ? "Encrypt Note" : "Decrypt Note"}
              </h3>
            </div>

            <button
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors button-pop"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 fade-in">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 slide-up-fade">
              <XCircle size={18} className="text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-center gap-2 slide-up-fade">
              <CheckCircle size={18} className="text-green-500" />
              <span className="text-sm">{success}</span>
            </div>
          )}
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (isEncrypting) {
              handleEncrypt();
            } else {
              handleDecrypt();
            }
          }} className="mb-6 space-y-4 reveal-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEncrypting ? "Create Password" : "Enter Password"}
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEncrypting ? "Create a strong password" : "Enter your password"}
                  className="w-full px-4 pl-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 focus-border"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Lock size={16} className="transition-all duration-300 hover:text-blue-500" />
                </div>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors button-pop"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {isEncrypting && (
              <div className="space-y-4 float-in stagger-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      ref={confirmPasswordInputRef}
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-4 pl-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 focus-border"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <Shield size={16} className="transition-all duration-300 hover:text-blue-500" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors button-pop"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password strength meter */}
                {password && passwordStrength && (
                  <div className="space-y-1 fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Password Strength</span>
                      <span className={clsx(
                        "font-medium",
                        passwordStrength.score < 3 ? "text-red-500" : 
                        passwordStrength.score < 5 ? "text-yellow-500" : "text-green-500"
                      )}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-500 ease-out`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      ></div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-600 pl-4 text-appear">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="list-disc">{item}</li>
                        ))}
                      </ul>
                    )}
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