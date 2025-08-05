import { ChatOllama } from "@langchain/ollama";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { chatAgent, LangGraphChatAgent } from "./langgraph-agent";

// List of tools available for the agent
import { documentProcessor } from "./document-service";
import { webSearchTool, webScrapeTool } from "./web-search-service";

import "dotenv/config";

// Legacy function for backward compatibility
function createModel(modelName: string) {
  return new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    temperature: 0.3,
  });
}

// New enhanced chat service using LangGraph
export class EnhancedChatService {
  private agent: LangGraphChatAgent;
  private conversationHistory: Map<string, BaseMessage[]> = new Map();
  private useWebSearch: boolean = false;

  constructor() {
    this.agent = chatAgent;
  }

  // Add a method to enable/disable web search
  setWebSearchEnabled(enabled: boolean): void {
    this.useWebSearch = enabled;
  }

  async streamMessage(
    message: string, 
    sessionId: string = 'default',
    modelName?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      if (modelName) {
        this.agent.changeModel(modelName);
      }

      const history = this.conversationHistory.get(sessionId) || [];
      let response: string;
      
      if (this.useWebSearch) {
        // 1. Get search results
        const searchResults = await webSearchTool.invoke({ query: message });
        
        // Enhanced prompt for structured response
        response = await this.agent.streamMessage(
          `[INSTRUCTIONS]
          Answer the query using the provided search results. Structure your response EXACTLY as follows:

          1.  **Answer:** Provide ONE clear, direct sentence answering the query "${message}".
          2.  **Summary:** Give a concise summary (2-3 short sentences) of the key points from the sources below.
          3.  **Sources:** List the sources used.
          ${searchResults}

          Be extremely concise overall. Do not add explanations beyond what is asked. Focus on accuracy. And give ONLY ONE answer unless asked to elaborate.
          Query: "${message}"
          `,
          history,
          onChunk
        );
      } else {
        // Normal concise processing
        response = await this.agent.streamMessage(
          `[INSTRUCTIONS] Answer in ONE sentence unless asked to elaborate. Query: "${message}"`,
          history,
          onChunk
        );
      }
      
      // Update history
      const updatedHistory = [
        ...history,
        new HumanMessage(message),
        new AIMessage(response)
      ].slice(-20); // Keep last 20 messages
      
      this.conversationHistory.set(sessionId, updatedHistory);
      
      return response;
    } catch (error) {
      console.error('Error:', error);
      return `Error: ${error instanceof Error ? error.message : 'Request failed'}`;
    }
  }

  async uploadDocument(fileName: string, content: string): Promise<string> {
    return await this.agent.uploadDocument(fileName, content);
  }

  getAvailableTools(): string[] {
    return this.agent.getAvailableTools();
  }

  clearConversationHistory(sessionId: string = 'default'): void {
    this.conversationHistory.delete(sessionId);
  }

  getConversationHistory(sessionId: string = 'default'): BaseMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }
}

// Export singleton instance
export const enhancedChatService = new EnhancedChatService();

// Export legacy function for backward compatibility
export { createModel };