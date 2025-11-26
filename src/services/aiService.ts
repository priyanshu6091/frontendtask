import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client only if API key is available
let genAI: GoogleGenerativeAI | null = null;
let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

const initializeGemini = () => {
  if (!genAI && import.meta.env.VITE_GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('Gemini AI initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize Gemini client:', error);
    }
  }
  return model;
};

// Initialize on module load
initializeGemini();

export interface GrammarError {
  text: string;
  message: string;
  suggestions: string[];
  offset: number;
  length: number;
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone';
  severity?: 'low' | 'medium' | 'high';
  confidence?: number;
}

export interface ContentInsight {
  type: 'summary' | 'keywords' | 'sentiment' | 'readability' | 'suggestions';
  title: string;
  content: string;
  confidence: number;
}

export interface NoteSuggestion {
  type: 'related' | 'improve' | 'organize' | 'expand';
  message: string;
  noteId?: string;
  noteTitle?: string;
}

export class AIService {
  private static instance: AIService;
  private termCache = new Map<string, string>();
  private insightsCache = new Map<string, ContentInsight[]>();
  private grammarCache = new Map<string, GrammarError[]>();

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Get definition for a term using Gemini
   */
  async getTermDefinition(term: string): Promise<string> {
    // Check cache first
    if (this.termCache.has(term.toLowerCase())) {
      return this.termCache.get(term.toLowerCase())!;
    }

    // Ensure model is initialized
    const aiModel = initializeGemini();
    
    // Return fallback if Gemini is not available
    if (!aiModel) {
      return 'AI definitions are not available. Please check your API key configuration.';
    }

    try {
      const prompt = `Define the term "${term}" in simple, clear language. Provide a concise definition in 1-2 sentences (max 60 words). If it's a technical term, explain it in an accessible way.`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const definition = response.text() || 'Definition not available';

      // Cache the result
      this.termCache.set(term.toLowerCase(), definition);

      return definition;
    } catch (error: any) {
      console.error('Error fetching definition:', error);

      // Handle specific API errors
      if (error.status === 403 || error.message?.includes('API key')) {
        return 'API access denied. Please check your API key permissions.';
      } else if (error.status === 429) {
        return 'Rate limit exceeded. Please try again later.';
      }

      return 'Unable to fetch definition at this time.';
    }
  }

  /**
   * Identify key terms in text
   */
  identifyKeyTerms(text: string): string[] {
    const patterns = [
      // Technical terms (camelCase, PascalCase)
      /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
      // Acronyms (2+ capital letters)
      /\b[A-Z]{2,}\b/g,
      // Terms with special characters
      /\b\w+[-_.]\w+\b/g,
    ];

    const terms = new Set<string>();

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length > 2) {
            terms.add(match);
          }
        });
      }
    });

    return Array.from(terms);
  }

  /**
   * Generate content insights using Gemini
   */
  async generateInsights(content: string, title: string = ''): Promise<ContentInsight[]> {
    const cacheKey = `${title}-${content}`.slice(0, 100);

    // Check cache first
    if (this.insightsCache.has(cacheKey)) {
      return this.insightsCache.get(cacheKey)!;
    }

    // Ensure model is initialized
    const aiModel = initializeGemini();

    if (!aiModel || !content.trim()) {
      console.warn('AI model not available or content empty for insights generation');
      return [];
    }

    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      if (plainText.length < 50) {
        return [];
      }

      const insights: ContentInsight[] = [];

      // Generate summary
      const summaryPrompt = `Summarize this note in ONE concise sentence (max 100 characters):\n\nTitle: ${title}\n\nContent: ${plainText.slice(0, 500)}`;
      const summaryResult = await aiModel.generateContent(summaryPrompt);
      const summaryResponse = await summaryResult.response;
      const summary = summaryResponse.text();

      if (summary) {
        insights.push({
          type: 'summary',
          title: 'Quick Summary',
          content: summary.trim().slice(0, 150),
          confidence: 0.85
        });
      }

      // Extract keywords
      const keywordsPrompt = `Extract 3-5 key themes or topics from this note. Return as comma-separated list:\n\n${plainText.slice(0, 500)}`;
      const keywordsResult = await aiModel.generateContent(keywordsPrompt);
      const keywordsResponse = await keywordsResult.response;
      const keywords = keywordsResponse.text();

      if (keywords) {
        insights.push({
          type: 'keywords',
          title: 'Key Themes',
          content: keywords.trim(),
          confidence: 0.75
        });
      }

      // Cache the results
      this.insightsCache.set(cacheKey, insights);

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Generate tags for a note using Gemini
   */
  async generateTags(content: string, title: string = ''): Promise<string[]> {
    // Ensure model is initialized
    const aiModel = initializeGemini();
    
    if (!aiModel || !content.trim()) {
      console.warn('AI model not available or content empty for tag generation');
      return [];
    }

    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      if (plainText.length < 30) {
        return ['draft'];
      }

      const prompt = `Generate 3-5 specific, actionable tags for this note. Tags should be:\n- Single words or short 2-3 word phrases\n- Lowercase\n- Specific (not generic like 'notes' or 'information')\n- Comma-separated\n\nTitle: ${title}\nContent: ${plainText.slice(0, 400)}\n\nReturn ONLY the tags as a comma-separated list:`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const tagsString = response.text().trim();

      // Parse tags
      const tags = tagsString
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length < 30)
        .slice(0, 5);

      return tags;
    } catch (error: unknown) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  /**
   * Check grammar using Gemini
   */
  async checkGrammar(text: string): Promise<GrammarError[]> {
    const plainText = this.htmlToText(text);
    const cacheKey = plainText.slice(0, 100);

    // Check cache
    if (this.grammarCache.has(cacheKey)) {
      return this.grammarCache.get(cacheKey)!;
    }

    // Ensure model is initialized
    const aiModel = initializeGemini();

    if (!aiModel || plainText.length < 10) {
      console.warn('AI model not available or text too short for grammar check');
      return [];
    }

    try {
      const prompt = `Check this text for grammar, spelling, and style errors. For each error found, provide:
1. The incorrect text
2. A clear error message
3. The corrected version

Format each error as: ERROR_TEXT | MESSAGE | CORRECTION

Text to check:
${plainText}

If no errors, return: NO_ERRORS`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const resultText = response.text();

      if (resultText.includes('NO_ERRORS')) {
        this.grammarCache.set(cacheKey, []);
        return [];
      }

      // Parse errors
      const errors: GrammarError[] = [];
      const lines = resultText.split('\n').filter(line => line.includes('|'));

      lines.forEach((line) => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          const [errorText, message, correction] = parts;
          const offset = plainText.indexOf(errorText);

          if (offset >= 0) {
            errors.push({
              text: errorText,
              message: message,
              suggestions: [correction],
              offset: offset,
              length: errorText.length,
              type: message.toLowerCase().includes('spell') ? 'spelling' : 'grammar',
              severity: 'medium',
              confidence: 80
            });
          }
        }
      });

      this.grammarCache.set(cacheKey, errors.splice(0, 10)); // Limit to 10 errors
      return errors;
    } catch (error) {
      console.error('Error checking grammar:', error);
      return [];
    }
  }

  /**
   * Generate note suggestions using Gemini
   */
  async generateNoteSuggestions(
    currentNote: { title: string; content: string },
    allNotes: Array<{ id: string; title: string; content: string }>
  ): Promise<NoteSuggestion[]> {
    // Ensure model is initialized
    const aiModel = initializeGemini();
    
    if (!aiModel || !currentNote.content.trim()) {
      console.warn('AI model not available or content empty for note suggestions');
      return [];
    }

    try {
      const plainText = currentNote.content.replace(/<[^>]*>/g, '').trim();
      const otherTitles = allNotes
        .map(note => note.title)
        .filter(t => t)
        .slice(0, 5)
        .join(', ');

      const prompt = `Based on this note, suggest 2-3 ways to improve it:\n\nTitle: ${currentNote.title}\nContent: ${plainText.slice(0, 300)}\n\nOther notes: ${otherTitles}\n\nProvide actionable suggestions (one per line):`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const suggestions = response.text();

      const lines = suggestions.split('\n').filter(line => line.trim());
      return lines.slice(0, 3).map((line, index) => ({
        type: index === 0 ? 'improve' : index === 1 ? 'organize' : 'expand',
        message: line.replace(/^[\d\-\*\.]\s*/, '').trim()
      })) as NoteSuggestion[];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.termCache.clear();
    this.insightsCache.clear();
    this.grammarCache.clear();
  }

  /**
   * Supported languages for translation
   */
  static readonly SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  ] as const;

  /**
   * Translate content to a target language using Gemini
   */
  async translateContent(
    content: string,
    targetLanguage: string,
    preserveFormatting: boolean = true
  ): Promise<{ translatedContent: string; detectedSourceLanguage?: string }> {
    // Ensure model is initialized
    const aiModel = initializeGemini();

    if (!aiModel) {
      throw new Error('AI translation is not available. Please check your API key configuration.');
    }

    if (!content.trim()) {
      return { translatedContent: '' };
    }

    try {
      // Find the target language name
      const targetLang = AIService.SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
      const targetLangName = targetLang?.name || targetLanguage;

      const plainText = content.replace(/<[^>]*>/g, '').trim();
      
      // Build the translation prompt
      const prompt = preserveFormatting
        ? `Translate the following text to ${targetLangName}. 
Preserve the original formatting, paragraph structure, and any bullet points or numbered lists.
If the text contains technical terms, translate them appropriately while keeping their meaning clear.
First, briefly identify the source language in brackets like [Source: English], then provide the translation.

Text to translate:
${plainText}

Provide ONLY the translated text after the source language identification. Do not add any explanations or notes.`
        : `Translate the following text to ${targetLangName}:

${plainText}

First identify the source language in brackets like [Source: English], then provide only the translated text.`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      // Extract source language if detected
      let detectedSourceLanguage: string | undefined;
      let cleanedTranslation = translatedText;

      const sourceMatch = translatedText.match(/\[Source:\s*([^\]]+)\]/i);
      if (sourceMatch) {
        detectedSourceLanguage = sourceMatch[1].trim();
        cleanedTranslation = translatedText.replace(/\[Source:\s*[^\]]+\]\s*/i, '').trim();
      }

      return {
        translatedContent: cleanedTranslation,
        detectedSourceLanguage
      };
    } catch (error: unknown) {
      console.error('Error translating content:', error);
      
      if (error instanceof Error) {
        if (error.message?.includes('API key')) {
          throw new Error('API access denied. Please check your API key permissions.');
        } else if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      
      throw new Error('Unable to translate content at this time. Please try again.');
    }
  }

  /**
   * Detect the language of the content
   */
  async detectLanguage(content: string): Promise<string> {
    const aiModel = initializeGemini();

    if (!aiModel || !content.trim()) {
      return 'unknown';
    }

    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim().slice(0, 500);
      
      const prompt = `Identify the language of the following text. Return ONLY the language name in English (e.g., "English", "Spanish", "French", etc.):

${plainText}`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const detectedLanguage = response.text().trim();

      return detectedLanguage;
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'unknown';
    }
  }

  /**
   * Generate a title for a note based on its content using Gemini
   */
  async generateTitle(content: string): Promise<string> {
    // Ensure model is initialized
    const aiModel = initializeGemini();

    if (!aiModel) {
      return 'Untitled Note';
    }

    if (!content.trim()) {
      return 'Untitled Note';
    }

    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      
      // Need at least some content to generate a meaningful title
      if (plainText.length < 10) {
        return 'Untitled Note';
      }

      const prompt = `Generate a concise, descriptive title for this note content. The title should be:
- 3-7 words maximum
- Descriptive of the main topic or theme
- Professional and clear
- NOT include quotes or special characters
- NOT be generic like "Note" or "Untitled"

Content:
${plainText.slice(0, 500)}

Return ONLY the title, nothing else:`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      let title = response.text().trim();

      // Clean up the title
      title = title
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^Title:\s*/i, '') // Remove "Title:" prefix if present
        .replace(/\*+/g, '') // Remove asterisks
        .trim();

      // Ensure title is not too long
      if (title.length > 60) {
        title = title.slice(0, 57) + '...';
      }

      // Fallback if title is empty or too short
      if (!title || title.length < 2) {
        return 'Untitled Note';
      }

      return title;
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Untitled Note';
    }
  }
}
