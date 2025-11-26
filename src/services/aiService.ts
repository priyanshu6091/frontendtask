import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client only if API key is available
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (import.meta.env.VITE_GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  } catch (error) {
    console.warn('Failed to initialize Gemini client:', error);
  }
}

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

    // Return fallback if Gemini is not available
    if (!model) {
      return 'AI definitions are not available. Please check your API key configuration.';
    }

    try {
      const prompt = `Define the term "${term}" in simple, clear language. Provide a concise definition in 1-2 sentences (max 60 words). If it's a technical term, explain it in an accessible way.`;

      const result = await model.generateContent(prompt);
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

    if (!model || !content.trim()) {
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
      const summaryResult = await model.generateContent(summaryPrompt);
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
      const keywordsResult = await model.generateContent(keywordsPrompt);
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
    if (!model || !content.trim()) {
      return [];
    }

    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      if (plainText.length < 30) {
        return ['draft'];
      }

      const prompt = `Generate 3-5 specific, actionable tags for this note. Tags should be:\n- Single words or short 2-3 word phrases\n- Lowercase\n- Specific (not generic like 'notes' or 'information')\n- Comma-separated\n\nTitle: ${title}\nContent: ${plainText.slice(0, 400)}\n\nReturn ONLY the tags as a comma-separated list:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const tagsString = response.text().trim();

      // Parse tags
      const tags = tagsString
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length < 30)
        .slice(0, 5);

      return tags;
    } catch (error: any) {
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

    if (!model || plainText.length < 10) {
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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const resultText = response.text();

      if (resultText.includes('NO_ERRORS')) {
        this.grammarCache.set(cacheKey, []);
        return [];
      }

      // Parse errors
      const errors: GrammarError[] = [];
      const lines = resultText.split('\n').filter(line => line.includes('|'));

      lines.forEach((line, index) => {
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
    if (!model || !currentNote.content.trim()) {
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

      const result = await model.generateContent(prompt);
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
}
