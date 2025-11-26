import React, { useState, useEffect, useMemo } from 'react';
import { AIService } from '../services/aiService';
import { 
  X, 
  Languages, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight, 
  Search,
  Replace,
  FileText,
  Globe
} from 'lucide-react';
import { clsx } from 'clsx';

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  onReplaceContent: (newContent: string) => void;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  isOpen,
  onClose,
  content,
  title,
  onReplaceContent
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [translatedContent, setTranslatedContent] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preserveFormatting, setPreserveFormatting] = useState(true);

  const languages = AIService.SUPPORTED_LANGUAGES;

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const query = searchQuery.toLowerCase();
    return languages.filter(
      lang =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [searchQuery, languages]);

  // Group languages by region for better UX
  const popularLanguages = useMemo(() => {
    const popularCodes = ['es', 'fr', 'de', 'zh', 'ja', 'pt', 'it', 'ko'];
    return languages.filter(l => popularCodes.includes(l.code));
  }, [languages]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranslatedContent('');
      setError(null);
      setCopied(false);
      setDetectedLanguage(null);
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!content.trim()) {
      setError('No content to translate');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslatedContent('');

    try {
      const aiService = AIService.getInstance();
      const result = await aiService.translateContent(
        content,
        selectedLanguage,
        preserveFormatting
      );

      setTranslatedContent(result.translatedContent);
      if (result.detectedSourceLanguage) {
        setDetectedLanguage(result.detectedSourceLanguage);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedContent) return;

    try {
      await navigator.clipboard.writeText(translatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReplace = () => {
    if (!translatedContent) return;
    onReplaceContent(translatedContent);
    onClose();
  };

  const selectedLangInfo = languages.find(l => l.code === selectedLanguage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Languages className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Translate Note</h2>
              <p className="text-sm text-gray-500">
                Translate "{title || 'Untitled'}" to another language
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Language Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Globe size={16} />
                Select Target Language
              </label>
              {detectedLanguage && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Detected: {detectedLanguage}
                </span>
              )}
            </div>

            {/* Search Languages */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Popular Languages */}
            {!searchQuery && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Popular Languages
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                        selectedLanguage === lang.code
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Languages Grid */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {searchQuery ? 'Search Results' : 'All Languages'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 text-left',
                      selectedLanguage === lang.code
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{lang.name}</span>
                      <span className={clsx(
                        'text-xs truncate',
                        selectedLanguage === lang.code ? 'text-blue-100' : 'text-gray-500'
                      )}>
                        {lang.nativeName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {filteredLanguages.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No languages found matching "{searchQuery}"
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveFormatting}
                  onChange={(e) => setPreserveFormatting(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Preserve formatting</span>
              </label>
            </div>
          </div>

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !content.trim()}
            className={clsx(
              'w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2',
              isTranslating || !content.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            )}
          >
            {isTranslating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Translating to {selectedLangInfo?.name}...</span>
              </>
            ) : (
              <>
                <Languages size={20} />
                <span>Translate to {selectedLangInfo?.name}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Translation Result */}
          {translatedContent && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText size={16} />
                  Translation Result
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {selectedLangInfo?.flag} {selectedLangInfo?.name}
                  </span>
                </h3>
              </div>
              
              <div className="relative">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap text-gray-800">
                  {translatedContent}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className={clsx(
                    'flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2',
                    copied
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      <span>Copy Translation</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleReplace}
                  className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Replace size={18} />
                  <span>Replace Note Content</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by Google Gemini AI</span>
            <span>{content.replace(/<[^>]*>/g, '').length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};
