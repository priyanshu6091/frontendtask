// Manual Grammar Checker Test
console.log('🧪 Testing Enhanced Grammar Checker...');

// Test the grammar checker with various error types
const testCases = [
  {
    name: "Grammar Errors",
    text: "This sentence have subject-verb disagreement. The team were working together."
  },
  {
    name: "Spelling Errors", 
    text: "The recieve function should handel the response correctly."
  },
  {
    name: "Style Issues",
    text: "The performance is much more better now. It's very very important."
  },
  {
    name: "Clarity Problems",
    text: "When you click it, something happens that might be important."
  },
  {
    name: "Mixed Errors",
    text: "This have several erors and the API consist of many component."
  }
];

// Function to test grammar checker
async function testGrammarChecker() {
  try {
    const { AIService } = await import('/src/services/aiService.ts');
    const aiService = AIService.getInstance();
    
    console.log('🎯 Testing Enhanced Grammar Checker Features');
    console.log('============================================');
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: ${testCase.name}`);
      console.log(`Text: "${testCase.text}"`);
      
      try {
        const results = await aiService.checkGrammar(testCase.text);
        console.log(`✅ Found ${results.length} issues:`);
        
        results.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue.type.toUpperCase()} (${issue.severity}): "${issue.text}"`);
          console.log(`     → ${issue.message}`);
          console.log(`     → Suggestions: ${issue.suggestions.join(', ')}`);
          console.log(`     → Confidence: ${issue.confidence}%`);
        });
      } catch (error) {
        console.error(`❌ Error testing ${testCase.name}:`, error);
      }
    }
    
    console.log('\n🎉 Grammar checker testing completed!');
    console.log('\n💡 You can also test manually by:');
    console.log('1. Creating a new note');
    console.log('2. Adding text with errors');
    console.log('3. Expanding the Grammar Check section');
    console.log('4. Clicking "Check Grammar"');
    console.log('5. Using "Apply All" to fix all issues at once');
    
  } catch (error) {
    console.error('❌ Failed to load AIService:', error);
  }
}

// Auto-run the test
testGrammarChecker();
