import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { webSearchTool, webScrapeTool } from "./web-search-service";
import { createDocumentSearchTool, createDocumentUploadTool, documentProcessor } from "./document-service";

export class LangGraphChatAgent {
  private model: ChatOllama;
  private tools: any[];

  constructor(modelName: string = "llama3.2") {
    // Initialize the model
    this.model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: modelName,
      temperature: 0.3,
    });

    // Initialize tools
    this.tools = [
      webSearchTool,
      webScrapeTool,
      createDocumentSearchTool(documentProcessor),
      createDocumentUploadTool(documentProcessor),
    ];
  }

  private async executeToolIfNeeded(message: string): Promise<string> {
    // Simple tool detection and execution
    const lowerMessage = message.toLowerCase();
    
    // Check for web search intent
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look up')) {
      if (lowerMessage.includes('web') || lowerMessage.includes('internet') || lowerMessage.includes('online')) {
        try {
          const result = await webSearchTool.func({ query: message, numResults: 3 });
          return `I found some information online:\n\n${result}`;
        } catch (error) {
          console.error('Web search error:', error);
        }
      }
    }
    
    // Check for document search intent
    if (lowerMessage.includes('document') || lowerMessage.includes('file') || lowerMessage.includes('uploaded')) {
      try {
        const docSearchTool = createDocumentSearchTool(documentProcessor);
        const result = await docSearchTool.func({ query: message, maxResults: 3 });
        return `I searched through your documents:\n\n${result}`;
      } catch (error) {
        console.error('Document search error:', error);
      }
    }
    
    return '';
  }

  async processMessage(message: string, conversationHistory: BaseMessage[] = []): Promise<string> {
    try {
      // First, check if we need to use tools
      const toolResult = await this.executeToolIfNeeded(message);
      
      // Prepare the conversation with tool results if any
      const messages = [...conversationHistory, new HumanMessage(message)];
      if (toolResult) {
        messages.push(new AIMessage(toolResult));
        messages.push(new HumanMessage("Based on the information above, please provide a comprehensive answer to my original question."));
      }
      
      // Get response from the model
      const response = await this.model.invoke(messages);
      
      if (response && typeof response.content === 'string') {
        return response.content;
      }
      
      return "I apologize, but I couldn't generate a proper response.";
    } catch (error) {
      console.error('Error processing message:', error);
      return `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async streamMessage(
    message: string, 
    conversationHistory: BaseMessage[] = [],
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      // First, check if we need to use tools
      const toolResult = await this.executeToolIfNeeded(message);
      if (toolResult && onChunk) {
        onChunk(toolResult + "\n\n");
      }
      
      // Prepare the conversation
      const messages = [...conversationHistory, new HumanMessage(message)];
      if (toolResult) {
        messages.push(new AIMessage(toolResult));
        messages.push(new HumanMessage("Based on the information above, please provide a comprehensive answer to my original question."));
      }
      
      // Stream the model response
      const stream = await this.model.stream(messages);
      let finalResponse = "";
      
      for await (const chunk of stream) {
        if (chunk.content) {
          const content = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
          finalResponse += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }

      return finalResponse || "I apologize, but I couldn't generate a proper response.";
    } catch (error) {
      console.error('Error streaming message:', error);
      const errorMsg = `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (onChunk) {
        onChunk(errorMsg);
      }
      return errorMsg;
    }
  }

  // Method to upload and process documents
  async uploadDocument(fileName: string, content: string): Promise<string> {
    try {
      const chunks = await documentProcessor.processDocument(fileName, content);
      return `Successfully processed document "${fileName}" into ${chunks.length} chunks.`;
    } catch (error) {
      console.error('Error uploading document:', error);
      return `Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Method to get available tools
  getAvailableTools(): string[] {
    return this.tools.map(tool => `${tool.name}: ${tool.description}`);
  }

  // Method to change the model
  changeModel(modelName: string) {
    this.model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: modelName,
      temperature: 0.3,
    });
  }
}

// Export singleton instance
export const chatAgent = new LangGraphChatAgent();
