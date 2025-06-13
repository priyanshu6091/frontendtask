import { AIService } from '../services/aiService';
import { grammarTestContent } from '../data/grammarTestContent';

// Test the enhanced grammar checker
export async function testGrammarChecker() {
  const aiService = AIService.getInstance();

  console.log('🧪 Testing Enhanced Grammar Checker');
  console.log('=====================================\n');

  // Test 1: Technical content
  console.log('📋 Test 1: Technical Content');
  console.log('Content length:', grammarTestContent.technical.length);
  console.log('Is technical?', aiService['isTechnicalContent'](grammarTestContent.technical));
  
  try {
    const technicalErrors = await aiService.checkGrammar(grammarTestContent.technical);
    console.log('Errors found:', technicalErrors.length);
    technicalErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.type.toUpperCase()}: "${error.text}" - ${error.message}`);
      if (error.suggestions.length > 0) {
        console.log(`     Suggestions: ${error.suggestions.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Technical content test failed:', error);
  }

  console.log('\n📝 Test 2: General Content');
  console.log('Content length:', grammarTestContent.general.length);
  console.log('Is technical?', aiService['isTechnicalContent'](grammarTestContent.general));
  
  try {
    const generalErrors = await aiService.checkGrammar(grammarTestContent.general);
    console.log('Errors found:', generalErrors.length);
    generalErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.type.toUpperCase()}: "${error.text}" - ${error.message}`);
      if (error.suggestions.length > 0) {
        console.log(`     Suggestions: ${error.suggestions.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('General content test failed:', error);
  }

  console.log('\n🔄 Test 3: Mixed Content');
  console.log('Content length:', grammarTestContent.mixed.length);
  console.log('Is technical?', aiService['isTechnicalContent'](grammarTestContent.mixed));
  
  try {
    const mixedErrors = await aiService.checkGrammar(grammarTestContent.mixed);
    console.log('Errors found:', mixedErrors.length);
    mixedErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.type.toUpperCase()}: "${error.text}" - ${error.message}`);
      if (error.suggestions.length > 0) {
        console.log(`     Suggestions: ${error.suggestions.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Mixed content test failed:', error);
  }

  console.log('\n✅ Grammar checker tests completed!');
}

// Test HTML to text conversion
export function testHtmlToText() {
  const aiService = AIService.getInstance();
  
  console.log('\n🔄 Testing HTML to Text Conversion');
  console.log('==================================');
  
  const htmlSamples = [
    '<p>Simple paragraph with <strong>bold</strong> text.</p>',
    '<h2>Title</h2><p>Content with &amp; entities &nbsp; and &quot;quotes&quot;.</p>',
    '<ul><li>Item 1</li><li>Item 2</li></ul>',
    '<p>Text with <span data-term="API">API</span> highlighting.</p>'
  ];
  
  htmlSamples.forEach((html, i) => {
    const text = aiService['htmlToText'](html);
    console.log(`${i + 1}. HTML: ${html}`);
    console.log(`   Text: "${text}"`);
    console.log('');
  });
}

// Export for use in browser console
(window as any).testGrammarChecker = testGrammarChecker;
(window as any).testHtmlToText = testHtmlToText;
