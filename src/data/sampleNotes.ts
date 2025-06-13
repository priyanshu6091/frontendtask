import type { Note } from '../types';

export const sampleNotes: Note[] = [
  {
    id: 'sample-1',
    title: 'React Development Concepts',
    content: `<h2>Modern React Development</h2>
    <p>React is a JavaScript library for building user interfaces. Key concepts include:</p>
    <ul>
      <li><strong>Components</strong>: Reusable UI elements that encapsulate logic and presentation</li>
      <li><strong>Hooks</strong>: Functions like useState and useEffect that let you use state and lifecycle features</li>
      <li><strong>JSX</strong>: A syntax extension that allows you to write HTML-like code in JavaScript</li>
      <li><strong>Props</strong>: Properties passed to components to customize their behavior</li>
      <li><strong>State</strong>: Local component data that can change over time</li>
    </ul>
    <p>Modern tools include <em>TypeScript</em> for type safety, <em>Vite</em> for fast development, and <em>Tailwind CSS</em> for styling.</p>`,
    isPinned: true,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'sample-2',
    title: 'API Integration Best Practices',
    content: `<h2>Working with APIs</h2>
    <p>When integrating with REST APIs, consider these best practices:</p>
    <ol>
      <li><strong>Authentication</strong>: Use JWT tokens or OAuth for secure access</li>
      <li><strong>Error Handling</strong>: Implement proper HTTP status code handling</li>
      <li><strong>Caching</strong>: Cache responses to improve performance</li>
      <li><strong>Rate Limiting</strong>: Respect API rate limits to avoid 429 errors</li>
    </ol>
    <p>Popular tools include Axios for HTTP requests, React Query for caching, and GraphQL for more efficient data fetching.</p>`,
    isPinned: false,
    createdAt: new Date('2024-01-14T15:20:00Z'),
    updatedAt: new Date('2024-01-14T16:45:00Z')
  },
  {
    id: 'sample-3',
    title: 'Machine Learning Fundamentals',
    content: `<h2>ML Concepts Overview</h2>
    <p>Machine Learning encompasses various approaches to data analysis:</p>
    <ul>
      <li><strong>Supervised Learning</strong>: Training models with labeled datasets</li>
      <li><strong>Unsupervised Learning</strong>: Finding patterns in unlabeled data</li>
      <li><strong>Neural Networks</strong>: Deep learning models inspired by the brain</li>
      <li><strong>Algorithms</strong>: Classification, regression, clustering methods</li>
    </ul>
    <p>Key metrics include Accuracy, Precision, Recall, and F1 Score for model evaluation.</p>`,
    isPinned: false,
    createdAt: new Date('2024-01-13T09:15:00Z'),
    updatedAt: new Date('2024-01-13T09:45:00Z')
  }
];

export const loadSampleData = (): void => {
  const existingNotes = localStorage.getItem('notes-app-data');
  if (!existingNotes) {
    localStorage.setItem('notes-app-data', JSON.stringify(sampleNotes));
  }
};
