// Test script to verify grammar check functionality
// Run this in the browser console after opening the app

async function testGrammarCheck() {
  console.log('🧪 Testing Grammar Check Feature');
  console.log('================================');
  
  // Get the AI service instance
  const { AIService } = await import('/src/services/aiService.ts');
  const aiService = AIService.getInstance();
  
  // Test content with intentional errors
  const testContent = `This content have several errors that should be detected. The API consist of many components, and it's endpoint returns different responses. Their are some issues with grammar that needs to be fixed.

We also has some spelling erors like "reciever" and "seperately". The performance is much more better now.`;
  
  console.log('📝 Test Content:');
  console.log(testContent);
  console.log('\n🔍 Checking grammar...');
  
  try {
    const results = await aiService.checkGrammar(testContent);
    console.log('✅ Grammar check results:');
    console.table(results);
    
    if (results.length > 0) {
      console.log('🎯 Found', results.length, 'issues:');
      results.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type.toUpperCase()}: "${issue.text}" -> "${issue.suggestions[0]}" (${issue.message})`);
      });
    } else {
      console.log('ℹ️ No grammar issues found (or service unavailable)');
    }
  } catch (error) {
    console.error('❌ Grammar check failed:', error);
    console.log('💡 Make sure VITE_GROQ_API_KEY is set in your .env.local file');
  }
}

// Auto-run the test
testGrammarCheck();
