import Groq from 'groq-sdk';

// Initialize Groq client only if API key is available
let groq: Groq | null = null;

if (import.meta.env.VITE_GROQ_API_KEY) {
  try {
    groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true
    });
  } catch (error) {
    console.warn('Failed to initialize Groq client:', error);
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

  async getTermDefinition(term: string): Promise<string> {
    // Check cache first
    if (this.termCache.has(term.toLowerCase())) {
      return this.termCache.get(term.toLowerCase())!;
    }

    // Return fallback if Groq is not available
    if (!groq) {
      return 'AI definitions are not available. Please check your API key configuration.';
    }

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides concise, accurate definitions for technical terms, concepts, and general vocabulary. Keep definitions under 100 words and focus on clarity."
          },
          {
            role: "user",
            content: `Define the term "${term}" in simple, clear language. If it's a technical term, explain it in an accessible way.`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.3,
        max_tokens: 150,
      });

      const definition = chatCompletion.choices[0]?.message?.content || 'Definition not available';
      
      // Cache the result
      this.termCache.set(term.toLowerCase(), definition);
      
      return definition;
    } catch (error: any) {
      console.error('Error fetching definition:', error);
      
      // Handle specific API errors
      if (error.status === 403) {
        return 'API access denied. Please check your API key permissions.';
      } else if (error.status === 429) {
        return 'Rate limit exceeded. Please try again later.';
      } else if (error.status === 401) {
        return 'Invalid API key. Please check your configuration.';
      }
      
      return 'Unable to fetch definition at this time.';
    }
  }

  identifyKeyTerms(text: string): string[] {
    // Enhanced term identification using regex patterns
    const patterns = [
      // Technical terms (camelCase, PascalCase)
      /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
      // Acronyms (2+ capital letters)
      /\b[A-Z]{2,}\b/g,
      // Terms with special characters
      /\b\w+[-_.]\w+\b/g,
      // Common technical keywords
      /\b(?:API|SDK|HTTP|JSON|XML|CSS|HTML|JavaScript|TypeScript|React|Vue|Angular|Node|Express|MongoDB|SQL|NoSQL|REST|GraphQL|JWT|OAuth|Git|Docker|Kubernetes|AWS|Azure|GCP|CI\/CD|DevOps|Machine Learning|AI|Frontend|Backend|Database|Framework|Library|Component|Hook|State|Props|Redux|Context|Router|Bundle|Build|Deploy|Server|Client|Authentication|Authorization|Encryption|HTTPS|SSL|TLS|Cache|Performance|Optimization|Responsive|Mobile|Desktop|UX|UI|Design|Accessibility|SEO|Testing|Debug|Error|Exception|Promise|Async|Await|Callback|Event|Listener|Handler|Method|Function|Class|Object|Array|String|Number|Boolean|Variable|Constant|Loop|Condition|Algorithm|Data Structure|Recursion|Iteration|Sort|Search|Hash|Tree|Graph|Queue|Stack|Heap|Binary|Decimal|Hexadecimal|Base64|Unicode|UTF|ASCII|Regex|Pattern|Validation|Sanitization|Injection|XSS|CSRF|CORS|Middleware|Plugin|Extension|Module|Package|Dependency|Version|Upgrade|Migration|Rollback|Backup|Recovery|Monitoring|Logging|Analytics|Metrics|Dashboard|Report|Chart|Graph|Visualization|Data|Information|Knowledge|Intelligence|Learning|Training|Model|Prediction|Classification|Clustering|Regression|Neural Network|Deep Learning|Supervised|Unsupervised|Reinforcement|Feature|Label|Dataset|Training Set|Test Set|Validation|Cross Validation|Overfitting|Underfitting|Bias|Variance|Accuracy|Precision|Recall|F1 Score)\b/gi
    ];

    const terms = new Set<string>();
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Filter out common words and short terms
          if (match.length > 2 && !this.isCommonWord(match)) {
            terms.add(match);
          }
        });
      }
    });

    return Array.from(terms);
  }

  /**
   * Generate content insights for a note
   */
  async generateInsights(content: string, title: string = ''): Promise<ContentInsight[]> {
    const cacheKey = `${title}-${content}`.slice(0, 100);
    
    // Check cache first
    if (this.insightsCache.has(cacheKey)) {
      return this.insightsCache.get(cacheKey)!;
    }

    if (!groq || !content.trim()) {
      return [];
    }

    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      if (plainText.length < 50) {
        return []; // Too short for meaningful insights
      }

      const insights: ContentInsight[] = [];

      // Generate summary
      const summaryResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that creates concise, helpful summaries. Provide a 2-3 sentence summary that captures the key points."
          },
          {
            role: "user",
            content: `Summarize this note:\n\nTitle: ${title}\n\nContent: ${plainText}`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.3,
        max_tokens: 150,
      });

      const summary = summaryResponse.choices[0]?.message?.content;
      if (summary) {
        insights.push({
          type: 'summary',
          title: 'Summary',
          content: summary.trim(),
          confidence: 0.8
        });
      }

      // Extract key themes and keywords
      const keywordsResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an AI that extracts key themes and important concepts from text. Return only the most relevant keywords and themes, separated by commas."
          },
          {
            role: "user",
            content: `Extract the 5-8 most important keywords and themes from this text: ${plainText}`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.2,
        max_tokens: 100,
      });

      const keywords = keywordsResponse.choices[0]?.message?.content;
      if (keywords) {
        insights.push({
          type: 'keywords',
          title: 'Key Themes',
          content: keywords.trim(),
          confidence: 0.7
        });
      }

      // Analyze readability and provide suggestions
      const suggestionsResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an AI writing assistant. Analyze the text and provide 2-3 specific, actionable suggestions to improve clarity, structure, or completeness. Be constructive and helpful."
          },
          {
            role: "user",
            content: `Analyze this note and suggest improvements:\n\n${plainText}`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.4,
        max_tokens: 200,
      });

      const suggestions = suggestionsResponse.choices[0]?.message?.content;
      if (suggestions) {
        insights.push({
          type: 'suggestions',
          title: 'Improvement Suggestions',
          content: suggestions.trim(),
          confidence: 0.6
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
   * Enhanced HTML to text conversion with proper handling of entities and structure
   */
  private htmlToText(html: string): string {
    // Create a temporary DOM element for proper HTML parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Handle common HTML entities
    const entityMap: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&nbsp;': ' ',
      '&#39;': "'",
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '...'
    };

    // Replace HTML entities
    let text = tempDiv.textContent || tempDiv.innerText || '';
    Object.entries(entityMap).forEach(([entity, replacement]) => {
      text = text.replace(new RegExp(entity, 'g'), replacement);
    });

    // Normalize whitespace and line breaks
    text = text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
      .trim();

    return text;
  }

  /**
   * Check if text appears to be technical documentation
   */
  private isTechnicalContent(text: string): boolean {
    const technicalIndicators = [
      'API', 'SDK', 'database', 'pipeline', 'infrastructure', 'deployment',
      'algorithm', 'framework', 'architecture', 'configuration', 'implementation',
      'performance', 'optimization', 'scalability', 'integration', 'authentication',
      'authorization', 'encryption', 'caching', 'monitoring', 'logging'
    ];
    
    const lowercaseText = text.toLowerCase();
    const matches = technicalIndicators.filter(term => 
      lowercaseText.includes(term.toLowerCase())
    );
    
    return matches.length >= 2; // Consider technical if 2+ technical terms found
  }

  /**
   * Check grammar and provide corrections with improved accuracy
   */
  async checkGrammar(text: string): Promise<GrammarError[]> {
    console.log('🔍 Grammar check called with text length:', text.length);
    
    // Enhanced HTML to text conversion
    const plainText = this.htmlToText(text);
    console.log('📝 Plain text extracted:', plainText.substring(0, 200) + '...');
    
    const cacheKey = plainText.slice(0, 100);
    
    // Check cache first
    if (this.grammarCache.has(cacheKey)) {
      console.log('💾 Returning cached grammar results');
      return this.grammarCache.get(cacheKey)!;
    }

    if (!groq) {
      console.warn('❌ Groq not available for grammar check');
      return [];
    }
    
    if (plainText.length < 10) {
      console.log('⚠️ Text too short for grammar check:', plainText.length);
      return [];
    }

    const isTechnical = this.isTechnicalContent(plainText);
    console.log('🔧 Is technical content:', isTechnical);

    try {
      const systemPrompt = isTechnical
        ? `You are an AI grammar checker specialized in technical writing. Analyze technical content for genuine issues while respecting technical conventions:

TECHNICAL WRITING RULES:
1. Technical terms, APIs, acronyms, and code references are acceptable
2. Colons after headers introducing lists/explanations are CORRECT
3. Passive voice is often appropriate in technical documentation
4. Industry-standard terminology should not be changed
5. Focus on actual errors that hurt clarity or correctness

ANALYSIS CATEGORIES:
1. GRAMMAR: Critical grammar errors that affect understanding
2. SPELLING: Actual misspellings (not technical terms)
3. CLARITY: Confusing sentences, unclear technical explanations
4. STYLE: Improvements that enhance technical communication
5. TONE: Consistency in technical writing style

Return ONLY valid JSON array:
[
  {
    "text": "exact text from document needing improvement",
    "message": "Clear explanation why this is an issue in technical context",
    "suggestions": ["technical-appropriate suggestion"],
    "type": "grammar|spelling|clarity|style|tone",
    "severity": "high|medium|low",
    "confidence": 90
  }
]

Return [] if no genuine technical writing issues found.`
        : `You are an advanced AI grammar and style checker. Analyze the text comprehensively for multiple types of issues:

ANALYSIS CATEGORIES:
1. GRAMMAR: Subject-verb agreement, tense consistency, sentence structure
2. SPELLING: Misspellings, typos, incorrect word forms
3. STYLE: Word choice, redundancy, clarity improvements
4. CLARITY: Unclear sentences, ambiguous phrasing, readability issues
5. TONE: Professional consistency, appropriate formality level

IMPORTANT: Return ONLY a valid JSON array with detailed analysis:
[
  {
    "text": "exact text from document that needs improvement",
    "message": "Detailed explanation of the issue and why it should be changed",
    "suggestions": ["primary suggestion", "alternative suggestion"],
    "type": "grammar|spelling|style|clarity|tone",
    "severity": "high|medium|low",
    "confidence": 85
  }
]

SEVERITY GUIDELINES:
- HIGH: Critical grammar errors, major spelling mistakes, unclear meaning
- MEDIUM: Style improvements, minor grammar issues, word choice
- LOW: Optional suggestions, minor style preferences

Return empty array [] if no issues found.`;

      console.log('🤖 Making API call to Groq for grammar check...');
      
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Check this ${isTechnical ? 'technical documentation' : 'text'} for errors:\n\n${plainText}`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.1,
        max_tokens: 800,
      });

      const result = response.choices[0]?.message?.content?.trim();
      console.log('📥 Raw API response:', result);
      
      if (!result) {
        console.log('❌ No result from API');
        return [];
      }

      try {
        // Extract JSON array from the response - handle cases where AI adds extra text
        let jsonContent = result;
        
        // Look for JSON array start and end markers
        const jsonStart = result.indexOf('[');
        const jsonEnd = result.lastIndexOf(']') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          jsonContent = result.substring(jsonStart, jsonEnd);
          console.log('🔧 Extracted JSON:', jsonContent);
        }
        
        const errors = JSON.parse(jsonContent);
        console.log('✅ Parsed errors:', errors);
        if (Array.isArray(errors)) {
          // Enhanced error processing with better position detection
          const processedErrors: GrammarError[] = errors
            .map((error: any) => {
              // Improved text matching with fuzzy search for better positioning
              const errorText = error.text?.trim();
              if (!errorText) return null;

              // Try exact match first
              let offset = plainText.indexOf(errorText);
              
              // If exact match fails, try case-insensitive match
              if (offset === -1) {
                offset = plainText.toLowerCase().indexOf(errorText.toLowerCase());
              }
              
              // If still not found, try partial match with first few words
              if (offset === -1 && errorText.length > 10) {
                const firstWords = errorText.split(' ').slice(0, 3).join(' ');
                offset = plainText.toLowerCase().indexOf(firstWords.toLowerCase());
              }

              const result: GrammarError = {
                text: errorText,
                message: error.message || 'Issue detected',
                suggestions: Array.isArray(error.suggestions) ? error.suggestions : [],
                offset: Math.max(0, offset),
                length: errorText.length,
                type: (error.type as 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone') || 'grammar',
                severity: (error.severity as 'low' | 'medium' | 'high') || 'medium',
                confidence: typeof error.confidence === 'number' ? error.confidence : 80
              };
              
              return result;
            })
            .filter((error: GrammarError | null): error is GrammarError => 
              error !== null && error.offset >= 0
            );

          console.log('🎯 Final processed errors:', processedErrors.length);
          processedErrors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error.type.toUpperCase()}: "${error.text}" - ${error.message}`);
          });

          // Cache the results
          this.grammarCache.set(cacheKey, processedErrors);
          return processedErrors;
        }
      } catch (parseError) {
        console.error('Error parsing grammar check response:', parseError);
        console.log('Raw response:', result);
      }

      return [];
    } catch (error) {
      console.error('Error checking grammar:', error);
      return [];
    }
  }

  /**
   * Generate note suggestions based on content and other notes
   */
  async generateNoteSuggestions(
    currentNote: { title: string; content: string },
    allNotes: Array<{ id: string; title: string; content: string }>
  ): Promise<NoteSuggestion[]> {
    if (!groq || !currentNote.content.trim()) {
      return [];
    }

    try {
      const plainText = currentNote.content.replace(/<[^>]*>/g, '').trim();
      const otherNotes = allNotes
        .filter(note => note.content.trim())
        .slice(0, 10) // Limit for API efficiency
        .map(note => `"${note.title}": ${note.content.replace(/<[^>]*>/g, '').slice(0, 200)}`)
        .join('\n');

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that helps with note organization. Analyze the current note and other notes to suggest improvements, related content, or organizational tips. Provide 2-3 practical suggestions."
          },
          {
            role: "user",
            content: `Current note - "${currentNote.title}": ${plainText}\n\nOther notes:\n${otherNotes}\n\nProvide suggestions for improving or organizing this note.`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 300,
      });

      const suggestions = response.choices[0]?.message?.content;
      if (suggestions) {
        // Parse suggestions into structured format
        const lines = suggestions.split('\n').filter(line => line.trim());
        return lines.slice(0, 3).map((line, index) => ({
          type: index === 0 ? 'improve' : index === 1 ? 'organize' : 'expand',
          message: line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim()
        })) as NoteSuggestion[];
      }

      return [];
    } catch (error) {
      console.error('Error generating note suggestions:', error);
      return [];
    }
  }

  /**
   * Clear caches to free memory
   */
  clearCaches(): void {
    this.termCache.clear();
    this.insightsCache.clear();
    this.grammarCache.clear();
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
    ]);
    return commonWords.has(word.toLowerCase());
  }
}
