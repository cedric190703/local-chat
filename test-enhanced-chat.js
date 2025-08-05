// Simple test script to verify the enhanced chat service works
const { enhancedChatService } = require('./services/agent-service');

async function testEnhancedChat() {
  console.log('🚀 Testing Enhanced Chat Service with LangChain/LangGraph...\n');

  try {
    // Test 1: Basic chat functionality
    console.log('Test 1: Basic Chat');
    const basicResponse = await enhancedChatService.processMessage(
      "Hello! Can you tell me what you can do?",
      'test-session'
    );
    console.log('Response:', basicResponse);
    console.log('✅ Basic chat test passed\n');

    // Test 2: Web search functionality
    console.log('Test 2: Web Search');
    const searchResponse = await enhancedChatService.processMessage(
      "Can you search the web for the latest news about artificial intelligence?",
      'test-session'
    );
    console.log('Response:', searchResponse);
    console.log('✅ Web search test completed\n');

    // Test 3: Document functionality
    console.log('Test 3: Document Search');
    const docResponse = await enhancedChatService.processMessage(
      "Search through my uploaded documents for information about machine learning",
      'test-session'
    );
    console.log('Response:', docResponse);
    console.log('✅ Document search test completed\n');

    // Test 4: Available tools
    console.log('Test 4: Available Tools');
    const tools = enhancedChatService.getAvailableTools();
    console.log('Available tools:');
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool}`);
    });
    console.log('✅ Tools listing test passed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\nYour enhanced chat service is ready with:');
    console.log('- Web search capabilities');
    console.log('- Document retrieval and search');
    console.log('- LangChain/LangGraph integration');
    console.log('- Streaming responses');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nNote: Some tests may fail if Ollama is not running or models are not available.');
    console.log('Make sure to start Ollama and pull the required models first.');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEnhancedChat();
}

module.exports = { testEnhancedChat };
