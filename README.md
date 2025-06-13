# Smart Notes - AI-Powered Note Taking Application

A modern, responsive notes application built with React and TypeScript, featuring a custom rich text editor, intelligent note management, AI-powered features, and end-to-end encryption.

## 🌟 Core Features

### 📝 Custom Rich Text Editor
- **Built from scratch** with no external rich text libraries
- Bold, italic, underline formatting
- Text alignment (left, center, right)
- Multiple font sizes
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+S)

### 🗂️ Smart Note Management
- Create, edit, delete, and organize notes
- Pin/unpin important notes with visual indicators
- Real-time search across note titles and content
- Automatic saving with change detection
- Local storage persistence with date handling

### 🤖 AI-Powered Features
- **Glossary Highlighting**: Automatic identification and highlighting of technical terms
- **AI Insights**: Content analysis with summaries, key themes, and improvement suggestions
- **Grammar Check**: Real-time grammar, spelling, and style checking with corrections
- **Smart Suggestions**: Note organization and content enhancement recommendations
- **Term Definitions**: Hover tooltips with AI-generated explanations

### 🔐 Security & Encryption
- **End-to-End Encryption**: Password-protected notes with AES-256-GCM encryption
- **Secure Key Derivation**: PBKDF2 with 100,000 iterations
- **Password Strength Meter**: Real-time password security assessment
- **Secure Password Generator**: Built-in strong password generation

### 📱 Enhanced Mobile Experience
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Touch Gestures**: Swipe navigation, long-press actions, pinch-to-zoom
- **Mobile-First Design**: Collapsible sidebar and touch-friendly interfaces
- **Gesture Controls**: Natural mobile interactions for improved UX

### ⚙️ User Preferences & Persistence
- **Local Storage**: All data stored securely in browser
- **User Preferences**: Theme, font size, AI features, and more
- **Auto-Save**: Continuous saving with change detection
- **Settings Persistence**: Preferences saved between sessions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontendtask
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (Optional - for AI features)
   ```bash
   cp .env.example .env.local
   ```
   Add your Groq API key to enable AI-powered features:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
   Get your free API key from: https://console.groq.com/keys

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── RichTextEditor.tsx      # Custom rich text editor
│   ├── NotesList.tsx           # Notes sidebar with search
│   ├── NoteEditor.tsx          # Main editing interface
│   ├── NoteCard.tsx            # Individual note display
│   ├── GlossaryHighlighter.tsx # AI term highlighting
│   ├── GlossaryTooltip.tsx     # Hover definitions
│   ├── AIInsights.tsx          # AI-powered content analysis
│   ├── GrammarCheck.tsx        # Grammar checking component
│   └── EncryptionModal.tsx     # Note encryption interface
├── hooks/               # Custom React hooks
│   ├── useNotes.ts             # Notes management logic
│   ├── useUserPreferences.ts   # User settings management
│   └── useTouchGestures.ts     # Mobile gesture handling
├── services/            # External service integrations
│   ├── aiService.ts            # Groq AI integration
│   └── encryptionService.ts    # End-to-end encryption
├── types/               # TypeScript type definitions
│   └── index.ts               # Application types
└── App.tsx             # Main application component
```

### Key Technologies
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Lucide React** for beautiful, consistent icons
- **Groq SDK** for AI-powered features
- **Web Crypto API** for secure encryption
- **Local Storage** for data persistence

## 💡 Usage Guide

### Creating and Editing Notes
1. Click the "+" button to create a new note
2. Enter a title and start writing content
3. Use the toolbar for text formatting
4. Notes auto-save as you type
5. Pin important notes to keep them at the top

### Using AI Features

#### AI Insights
- Click the **brain icon** in the toolbar
- Get automatic content summaries
- View extracted key themes and keywords
- Receive improvement suggestions
- See detailed note statistics

#### Grammar Check
- Grammar errors are highlighted automatically
- Click on suggestions to apply corrections
- Supports grammar, spelling, and style checking
- Real-time analysis as you type

#### Glossary Highlighting
- Technical terms are automatically highlighted in blue
- Hover over highlighted terms for AI-generated definitions
- Works with programming terms, acronyms, and technical concepts

### Note Encryption
1. Click the **lock icon** in the toolbar
2. Create a strong password (strength meter provided)
3. Confirm your password
4. Note content is encrypted using AES-256-GCM
5. Use the **unlock icon** to decrypt with your password

### Mobile Features
- **Swipe right** to go back from editor to note list
- **Long press** on editor to open AI insights
- **Pinch to zoom** for better readability
- Touch-optimized interface throughout

### Keyboard Shortcuts
- **Ctrl+B** - Bold text
- **Ctrl+I** - Italic text  
- **Ctrl+U** - Underline text
- **Ctrl+S** - Save note
- **Ctrl+I** - Toggle AI insights (in editor)

## 🔧 Advanced Features

### Security Implementation
- **AES-256-GCM Encryption**: Industry-standard encryption
- **PBKDF2 Key Derivation**: 100,000 iterations with salt
- **Secure Random Generation**: Cryptographically secure passwords
- **No Server Storage**: All encryption happens client-side

### AI Integration Details
- **Content Analysis**: Summarization and theme extraction
- **Grammar Checking**: Multi-language support with corrections
- **Term Recognition**: Advanced pattern matching for technical terms
- **Contextual Suggestions**: Smart recommendations based on content

### Performance Optimizations
- **Debounced AI Requests**: Efficient API usage
- **Caching Strategy**: Smart caching of AI responses
- **Lazy Loading**: Components loaded as needed
- **Memory Management**: Automatic cache cleanup

## 🔒 Privacy & Data Security

### Data Protection
- All notes stored locally in browser
- Optional end-to-end encryption for sensitive content
- No data transmitted to servers (except AI API calls)
- User controls all data retention

### AI Privacy
- Only individual terms sent for definitions
- No full note content transmitted
- Caching reduces external requests
- User can disable AI features entirely

## ⚙️ Configuration

### Environment Variables
- `VITE_GROQ_API_KEY`: API key for Groq AI service (optional)

### User Preferences
- **Theme**: Light, dark, or auto mode
- **Font Size**: Small, medium, or large
- **AI Features**: Enable/disable AI insights and grammar checking
- **Auto-Save**: Configure automatic saving behavior
- **Touch Gestures**: Enable/disable mobile gesture controls

## 🐛 Troubleshooting

### Common Issues
1. **AI features not working**: Ensure VITE_GROQ_API_KEY is set in .env.local
2. **Notes not saving**: Check browser local storage permissions
3. **Encryption not working**: Verify browser supports Web Crypto API
4. **Touch gestures not responding**: Enable touch gestures in preferences

### Browser Support
- Chrome 90+ (Full support)
- Firefox 88+ (Full support)
- Safari 14+ (Full support)
- Edge 90+ (Full support)

### Performance Tips
- Clear AI cache occasionally for better performance
- Use encryption sparingly for large notes
- Enable auto-save for best experience

## 🔧 Recent Fixes & Improvements

### Scrolling & Layout Issues Fixed ✅
- **Fixed Editor Scrolling**: Proper overflow handling for long content in the note editor
- **Grammar Check Visibility**: Fixed positioning and scrolling for grammar check section
- **Mobile Layout**: Improved responsive layout with proper container hierarchy
- **Content Overflow**: Ensured all content is accessible with proper scroll zones

### AI Insights Improvements ✅
- **Real-time Updates**: AI insights now update automatically when content changes
- **Debounced Updates**: Optimized API calls with 1-second debounce to prevent excessive requests
- **Manual Refresh**: Added refresh button for manual insight regeneration
- **Better Error Handling**: Improved fallback messages when AI services are unavailable
- **Auto-show Feature**: AI insights automatically appear for substantial content

### Enhanced User Experience ✅
- **Status Bar Improvements**: Better feedback with AI insights status and keyboard shortcuts
- **Empty State Handling**: Improved messaging for empty or short content
- **Loading States**: Better visual feedback during AI processing
- **Error Recovery**: Graceful handling of API failures with helpful error messages

## 📈 Future Enhancements

- [ ] Real-time collaborative editing
- [ ] Cloud synchronization options
- [ ] Advanced markdown support
- [ ] Plugin system for extensions
- [ ] Voice-to-text integration
- [ ] Advanced search with filters
- [ ] Export to multiple formats
- [ ] Offline-first PWA support

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and TypeScript
- Icons by Lucide React
- AI powered by Groq
- Styled with Tailwind CSS
- Encryption using Web Crypto API

---

**Smart Notes** - Making note-taking intelligent, secure, and beautiful. ✨
