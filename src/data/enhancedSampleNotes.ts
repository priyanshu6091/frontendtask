import type { Note } from '../types';

export const enhancedSampleNotes: Note[] = [
  {
    id: 'enhanced-1',
    title: '🚀 Advanced Features Demo',
    content: `<h2>Welcome to Enhanced Smart Notes!</h2>

<p>This note demonstrates the new advanced features implemented:</p>

<h3>🔐 Note Encryption</h3>
<p>Click the <strong>lock icon</strong> in the toolbar to encrypt this note with a password. The encryption uses <em>AES-256-GCM</em> with <em>PBKDF2</em> key derivation for maximum security.</p>

<h3>🧠 AI-Powered Insights</h3>
<p>Click the <strong>brain icon</strong> to see AI-generated insights about this note including:</p>
<ul>
  <li><strong>Content Summary</strong> - Automatic summarization of key points</li>
  <li><strong>Key Themes</strong> - Extracted important concepts and keywords</li>
  <li><strong>Improvement Suggestions</strong> - AI recommendations for better writing</li>
  <li><strong>Note Statistics</strong> - Word count, reading time, and AI terms detected</li>
</ul>

<h3>✏️ Grammar Check</h3>
<p>The AI automatically detects <em>grammar errors</em>, <em>spelling mistakes</em>, and <em>style issues</em>. Try writing some text with intentional mistakes to see the grammar checker in action!</p>

<h3>📱 Enhanced Touch Support</h3>
<p>On mobile devices, you can:</p>
<ul>
  <li><strong>Swipe right</strong> to go back from note editor to note list</li>
  <li><strong>Long press</strong> on the editor to open AI insights</li>
  <li><strong>Pinch to zoom</strong> for better readability</li>
</ul>

<h3>⚙️ User Preferences</h3>
<p>The app now saves your preferences including theme, font size, and AI feature toggles.</p>`,
    isPinned: true,
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T11:30:00Z')
  },
  {
    id: 'enhanced-2',
    title: '🔒 Encrypted Note Example',
    content: 'This note will be encrypted to demonstrate the security features.',
    isPinned: false,
    isEncrypted: true,
    encryptionData: {
      encrypted: 'demo_encrypted_content',
      salt: 'demo_salt',
      iv: 'demo_iv'
    },
    createdAt: new Date('2024-01-19T14:20:00Z'),
    updatedAt: new Date('2024-01-19T15:45:00Z')
  },
  {
    id: 'enhanced-3',
    title: '📊 Data Analysis with AI',
    content: `<h2>Machine Learning in Practice</h2>

<p>This note contains technical content perfect for testing AI insights and glossary features.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Neural Networks</strong> - Deep learning models inspired by biological neurons</li>
  <li><strong>TensorFlow</strong> - Google's machine learning framework</li>
  <li><strong>PyTorch</strong> - Facebook's dynamic neural network library</li>
  <li><strong>Gradient Descent</strong> - Optimization algorithm for training models</li>
</ul>

<h3>Implementation Steps</h3>
<ol>
  <li>Data preprocessing with <em>pandas</em> and <em>numpy</em></li>
  <li>Model architecture design using <em>Keras</em></li>
  <li>Training with <em>backpropagation</em> and <em>stochastic gradient descent</em></li>
  <li>Evaluation using <em>cross-validation</em> and <em>confusion matrix</em></li>
</ol>

<p>Performance metrics include <strong>Accuracy</strong>, <strong>Precision</strong>, <strong>Recall</strong>, and <strong>F1-Score</strong>. The model achieved 94.2% accuracy on the test dataset.</p>`,
    isPinned: false,
    createdAt: new Date('2024-01-18T09:15:00Z'),
    updatedAt: new Date('2024-01-18T16:30:00Z')
  }
];

export const loadEnhancedSampleData = (): void => {
  const existingNotes = localStorage.getItem('notes-app-data');
  if (!existingNotes) {
    localStorage.setItem('notes-app-data', JSON.stringify(enhancedSampleNotes));
  }
};
