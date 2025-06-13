export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  isEncrypted?: boolean;
  encryptionData?: {
    encrypted: string;
    salt: string;
    iv: string;
  };
  tags?: string[];
  category?: string;
  wordCount?: number;
  readingTime?: number; // in minutes
}

export interface EncryptedNote extends Omit<Note, 'title' | 'content'> {
  title: string; // Title is always visible
  content: string; // Placeholder content when encrypted
  isEncrypted: true;
  encryptionData: {
    encrypted: string;
    salt: string;
    iv: string;
  };
}

export interface RichTextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  range: {
    start: number;
    end: number;
  };
}

export interface ToolbarAction {
  type: 'bold' | 'italic' | 'underline' | 'fontSize' | 'alignment';
  value?: string | number;
}

export interface AIResponse {
  term: string;
  definition: string;
  confidence: number;
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  deltaX?: number;
  deltaY?: number;
  scale?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  enableAI: boolean;
  enableGrammarCheck: boolean;
  autoSave: boolean;
  touchGestures: boolean;
  showInsights: boolean;
}
