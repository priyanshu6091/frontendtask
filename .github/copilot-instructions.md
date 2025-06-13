<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Notes Application Development Instructions

This is a React TypeScript notes application with the following key features:

## Project Structure
- Custom Rich Text Editor (built from scratch, no external libraries like TinyMCE/Quill)
- Note Management System with CRUD operations
- Pin/Unpin functionality for important notes
- AI-powered glossary highlighting with hover explanations
- Modern, responsive UI with Tailwind CSS

## Key Implementation Guidelines
- Use React hooks for state management
- Implement contentEditable for rich text editing
- Use Groq SDK for AI features
- Focus on clean, modern UI/UX design
- Ensure full responsiveness across devices
- Follow TypeScript best practices

## AI Integration
- Auto-detect and highlight technical terms in notes
- Provide contextual explanations on hover
- Use Groq for AI-powered term definitions
