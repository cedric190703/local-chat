/**
 * @file This file contains the core agent service for the local chat application.
 * It uses LangGraph to create a chat agent that can interact with various tools.
 */

import { ChatOllama } from "@langchain/ollama";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { chatAgent, LangGraphChatAgent } from "./langgraph-agent";
import { runRag } from "./rag-service";

// List of tools available for the agent
import { documentProcessor } from "./document-service";
import { webSearchTool, webScrapeTool } from "./web-search-service";

import "dotenv/config";

/**
 * Creates a new ChatOllama model instance.
 * @param modelName The name of the model to create.
 * @returns A new ChatOllama model instance.
 * @deprecated This function is deprecated and will be removed in a future version.
 */
function createModel(modelName: string) {
  return new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    temperature: 0.3,
  });
}

/**
 * An enhanced chat service that uses LangGraph to provide a more intelligent chat experience.
 */
export class EnhancedChatService {
  private agent: LangGraphChatAgent;
  private conversationHistory: Map<string, BaseMessage[]> = new Map();
  private useWebSearch: boolean = false;

  constructor() {
    this.agent = chatAgent;
  }

  /**
   * Enables or disables web search for the agent.
   * @param enabled Whether to enable or disable web search.
   */
  setWebSearchEnabled(enabled: boolean): void {
    this.useWebSearch = enabled;
  }

  /**
   * Streams a message to the agent and returns the response.
   * @param message The message to send to the agent.
   * @param sessionId The ID of the session to use for the conversation.
   * @param modelName The name of the model to use for the conversation.
   * @param onChunk A callback function to be called with each chunk of the response.
   * @returns The full response from the agent.
   */
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
        // Try RAG with documents when available; fall back to normal agent
        const docs = this.agent.getAvailableTools().join(" ") // cheap check that tools are set
        try {
          response = await runRag(message, history, { modelName: (this as any).agent?.["model"]?.fields?.model ?? "llama3.2" })
          if (onChunk) onChunk(response)
        } catch {
          response = await this.agent.streamMessage(
            `[INSTRUCTIONS] Answer in ONE sentence unless asked to elaborate. Query: "${message}"`,
            history,
            onChunk
          );
        }
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

  /**
   * Uploads a document to the agent.
   * @param fileName The name of the file to upload.
   * @param content The content of the file to upload.
   * @returns A message indicating whether the upload was successful.
   */
  async uploadDocument(fileName: string, content: string): Promise<string> {
    return await this.agent.uploadDocument(fileName, content);
  }

  /**
   * Gets a list of the available tools.
   * @returns A list of the available tools.
   */
  getAvailableTools(): string[] {
    return this.agent.getAvailableTools();
  }

  /**
   * Clears the conversation history for a given session.
   * @param sessionId The ID of the session to clear the history for.
   */
  clearConversationHistory(sessionId: string = 'default'): void {
    this.conversationHistory.delete(sessionId);
  }

  /**
   * Gets the conversation history for a given session.
   * @param sessionId The ID of the session to get the history for.
   * @returns The conversation history for the given session.
   */
  getConversationHistory(sessionId: string = 'default'): BaseMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }
}

// Export singleton instance
export const enhancedChatService = new EnhancedChatService();

// Export legacy function for backward compatibility
export { createModel };
