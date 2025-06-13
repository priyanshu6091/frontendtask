# Grammar Check Feature Documentation

## Overview
The Grammar Check feature provides AI-powered grammar, spelling, and style checking for note content using the Groq AI service.

## Features

### ✅ Grammar Detection
- Subject-verb agreement errors
- Tense consistency issues
- Sentence structure problems

### ✅ Spelling Correction
- Common misspellings
- Technical term corrections
- Contextual spelling suggestions

### ✅ Style Improvements
- Redundant phrases
- Word choice optimization
- Clarity improvements

## How to Use

### 1. Access Grammar Check
1. Open any note in the editor
2. Start typing content (minimum 10 characters)
3. Expand the "Grammar & Style Check" section at the bottom
4. Grammar check runs automatically after 2 seconds of inactivity

### 2. Review Suggestions
- Each suggestion shows:
  - **Type**: Grammar, Spelling, or Style
  - **Original text**: Highlighted in red
  - **Suggested replacement**: Highlighted in green
  - **Explanation**: Why the change is recommended

### 3. Apply or Dismiss
- **Apply**: Click "Apply" to accept the suggestion
- **Dismiss**: Click "Dismiss" or the X button to ignore

## Example Usage

### Test Content
Create a new note and paste this content to see grammar checking in action:

```
This content have several errors that should be detected. The API consist of many components, and it's endpoint returns different responses. Their are some issues with grammar that needs to be fixed.

We also has some spelling erors like "reciever" and "seperately". The performance is much more better now.
```

### Expected Suggestions
1. **Grammar**: "have" → "has" (subject-verb agreement)
2. **Grammar**: "consist" → "consists" (subject-verb agreement)
3. **Grammar**: "it's" → "its" (possessive vs. contraction)
4. **Grammar**: "Their" → "There" (wrong word choice)
5. **Grammar**: "needs" → "need" (subject-verb agreement)
6. **Grammar**: "has" → "have" (subject-verb agreement)
7. **Spelling**: "erors" → "errors"
8. **Spelling**: "reciever" → "receiver"
9. **Spelling**: "seperately" → "separately"
10. **Style**: "much more better" → "much better" (redundancy)

## Technical Implementation

### Components
- **GrammarCheck.tsx**: Main component with UI and logic
- **AIService.ts**: Backend integration with Groq API
- **NoteEditor.tsx**: Integration point in the editor

### API Integration
Uses Groq's LLaMA model for grammar analysis:
- Model: `llama3-8b-8192`
- Input: Plain text (HTML stripped)
- Output: Structured error objects with suggestions

### Caching
- Results cached to avoid redundant API calls
- Cache cleared when content changes significantly
- Automatic refresh available via refresh button

## Configuration

### Environment Variables
```bash
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### Auto-Check Settings
- **Debounce**: 2 seconds after typing stops
- **Minimum length**: 10 characters
- **Maximum length**: No limit (but large texts may take longer)

## Error Handling

### Common Issues
1. **API Key Missing**: Shows error message with setup instructions
2. **Network Error**: Displays retry option
3. **Rate Limiting**: Automatic retry with exponential backoff
4. **Invalid Content**: Skips check for empty or very short content

### Fallback Behavior
- Graceful degradation when AI service unavailable
- Manual refresh option always available
- No blocking of other editor features

## Browser Console Testing

You can test the grammar checker directly in the browser console:

```javascript
// Import and test the service
const { AIService } = await import('/src/services/aiService.ts');
const aiService = AIService.getInstance();

const testText = "This have many error that need fixing.";
const results = await aiService.checkGrammar(testText);
console.table(results);
```

## Future Enhancements

### Planned Features
- [ ] Custom dictionary support
- [ ] Language detection and multi-language support
- [ ] Writing style preferences (formal, casual, academic)
- [ ] Integration with popular style guides
- [ ] Batch processing for multiple notes
- [ ] Offline grammar checking with local models

### Performance Improvements
- [ ] Incremental checking (only check changed paragraphs)
- [ ] Background processing for large documents
- [ ] Smart caching with content fingerprinting
- [ ] WebWorker implementation for non-blocking UI

## Troubleshooting

### Grammar Check Not Working
1. Check if GROQ API key is set correctly
2. Verify internet connection
3. Check browser console for errors
4. Try manual refresh with the refresh button

### Slow Performance
1. Check content length (very long texts take more time)
2. Verify API key has sufficient quota
3. Try smaller content chunks

### Incorrect Suggestions
1. Remember this is AI-powered - not 100% accurate
2. Use the dismiss option for incorrect suggestions
3. Context matters - AI may not understand domain-specific terms

## Support

For issues or questions about the grammar check feature:
1. Check the browser console for error messages
2. Verify your Groq API key configuration
3. Test with the provided example content
4. Check the network tab for API request failures
