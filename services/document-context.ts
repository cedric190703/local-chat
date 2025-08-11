/**
 * @file This file contains the document context manager for the local chat application.
 * It manages the context of documents for each prompt and tracks global images.
 */

import { documentProcessor } from "./document-service";

/**
 * Represents the context of a document for a specific prompt.
 */
export interface DocumentContext {
  promptId: string;
  documents: string[]; // Array of document file names for this prompt
  timestamp: Date;
}

/**
 * Represents an entry in the global image registry.
 */
export interface ImageRegistryEntry {
  fileName: string;
  content: string;
  timestamp: Date;
  promptId?: string | null; // Optional: which prompt this was uploaded with
}

/**
 * Manages the context of documents for each prompt and tracks global images.
 */
class DocumentContextManager {
  private promptContexts: Map<string, DocumentContext> = new Map();
  private globalImageRegistry: Map<string, ImageRegistryEntry> = new Map();
  private currentPromptId: string | null = null;

  /**
   * Starts a new prompt context.
   * @param promptId The ID of the prompt to start.
   * @returns The ID of the new prompt context.
   */
  startNewPrompt(promptId?: string): string {
    const id = promptId || this.generatePromptId();
    this.currentPromptId = id;
    
    this.promptContexts.set(id, {
      promptId: id,
      documents: [],
      timestamp: new Date()
    });
    
    return id;
  }

  /**
   * Adds a document to the current prompt context.
   * @param fileName The name of the file to add.
   * @param content The content of the file to add.
   * @param isImage Whether the file is an image.
   */
  addDocumentToCurrentPrompt(fileName: string, content: string, isImage: boolean = false): void {
    if (!this.currentPromptId) {
      this.startNewPrompt();
    }

    const context = this.promptContexts.get(this.currentPromptId!);
    if (context && !context.documents.includes(fileName)) {
      context.documents.push(fileName);
    }

    // If it's an image, also add to global registry
    if (isImage) {
      this.globalImageRegistry.set(fileName, {
        fileName,
        content,
        timestamp: new Date(),
        promptId: this.currentPromptId
      });
    }
  }

  /**
   * Gets the documents for a specific prompt.
   * @param promptId The ID of the prompt to get the documents for.
   * @returns The documents for the specified prompt.
   */
  getDocumentsForPrompt(promptId: string): string[] {
    const context = this.promptContexts.get(promptId);
    return context ? context.documents : [];
  }

  /**
   * Gets all documents for the current prompt.
   * @returns All documents for the current prompt.
   */
  getCurrentPromptDocuments(): string[] {
    if (!this.currentPromptId) return [];
    return this.getDocumentsForPrompt(this.currentPromptId);
  }

  /**
   * Gets all images that have been uploaded.
   * @returns All images that have been uploaded.
   */
  getAllImages(): ImageRegistryEntry[] {
    return Array.from(this.globalImageRegistry.values());
  }

  /**
   * Checks if a query is asking to describe all images.
   * @param query The query to check.
   * @returns Whether the query is asking to describe all images.
   */
  isDescribeAllImagesQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return (
      lowerQuery.includes("describe all images") ||
      lowerQuery.includes("describe all the images") ||
      lowerQuery.includes("describe all uploaded images") ||
      lowerQuery.includes("describe every image") ||
      (lowerQuery.includes("describe") && lowerQuery.includes("image") && 
       (lowerQuery.includes("all") || lowerQuery.includes("every")))
    );
  }

  /**
   * Gets the document context for a given query.
   * @param query The query to get the document context for.
   * @param promptId The ID of the prompt to get the document context for.
   * @returns The document context for the given query.
   */
  async getDocumentContext(query: string, promptId?: string): Promise<string> {
    const targetPromptId = promptId ?? this.currentPromptId;
    
    if (!targetPromptId) return "";

    // Special case: describe all images
    if (this.isDescribeAllImagesQuery(query)) {
      const allImages = this.getAllImages();
      if (allImages.length === 0) return "No images have been uploaded yet.";

      const imageDescriptions = allImages.map(img => 
        `Image: ${img.fileName} (uploaded ${img.timestamp.toLocaleString()})`
      ).join('\n');

      return `All uploaded images:\n${imageDescriptions}`;
    }

    // Normal case: use documents for specific prompt
    const documents = this.getDocumentsForPrompt(targetPromptId);
    if (documents.length === 0) return "";

    // Get relevant content from documents for this prompt
    const relevantChunks = [];
    for (const fileName of documents) {
      try {
        // For images in the prompt context, include the full content
        if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
          const imageEntry = this.globalImageRegistry.get(fileName);
          if (imageEntry) {
            relevantChunks.push(imageEntry.content);
          }
        } else {
          // For documents, search for relevant content
          const chunks = await documentProcessor.searchDocuments(query, 3);
          const relevantForFile = chunks.filter(chunk => chunk.metadata.source === fileName);
          relevantChunks.push(...relevantForFile.map(chunk => chunk.content));
        }
      } catch (error) {
        console.warn(`Error processing document ${fileName}:`, error);
      }
    }

    if (relevantChunks.length === 0) return "";

    return `Relevant context from uploaded documents:\n${relevantChunks.join('\n\n---\n\n')}`;
  }

  /**
   * Cleans up old prompt contexts.
   */
  cleanupOldContexts(): void {
    const contexts = Array.from(this.promptContexts.entries());
    if (contexts.length > 50) {
      // Sort by timestamp and remove oldest
      contexts.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      const toRemove = contexts.slice(0, contexts.length - 50);
      toRemove.forEach(([promptId]) => {
        this.promptContexts.delete(promptId);
      });
    }
  }

  /**
   * Clears all contexts and registries.
   */
  clearAll(): void {
    this.promptContexts.clear();
    this.globalImageRegistry.clear();
    this.currentPromptId = null;
  }

  /**
   * Generates a unique prompt ID.
   * @returns A unique prompt ID.
   */
  private generatePromptId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets statistics about the document context manager.
   * @returns Statistics about the document context manager.
   */
  getStats(): {
    totalPrompts: number;
    totalImages: number;
    currentPromptId: string | null;
  } {
    return {
      totalPrompts: this.promptContexts.size,
      totalImages: this.globalImageRegistry.size,
      currentPromptId: this.currentPromptId
    };
  }
}

// Singleton instance
export const documentContextManager = new DocumentContextManager();