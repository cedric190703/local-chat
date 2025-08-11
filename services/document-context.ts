/**
 * Document Context Manager
 * 
 * Manages document context for per-prompt usage and global image tracking.
 * 
 * Key features:
 * - Tracks documents uploaded for each specific prompt
 * - Maintains global registry of all images for "describe all images" functionality
 * - Provides context isolation between prompts while enabling global image access
 */

import { documentProcessor } from "./document-service";

export interface DocumentContext {
  promptId: string;
  documents: string[]; // Array of document file names for this prompt
  timestamp: Date;
}

export interface ImageRegistryEntry {
  fileName: string;
  content: string;
  timestamp: Date;
  promptId?: string | null; // Optional: which prompt this was uploaded with
}

class DocumentContextManager {
  private promptContexts: Map<string, DocumentContext> = new Map();
  private globalImageRegistry: Map<string, ImageRegistryEntry> = new Map();
  private currentPromptId: string | null = null;

  /**
   * Start a new prompt context
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
   * Add a document to the current prompt context
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
   * Get documents for a specific prompt
   */
  getDocumentsForPrompt(promptId: string): string[] {
    const context = this.promptContexts.get(promptId);
    return context ? context.documents : [];
  }

  /**
   * Get all documents for the current prompt
   */
  getCurrentPromptDocuments(): string[] {
    if (!this.currentPromptId) return [];
    return this.getDocumentsForPrompt(this.currentPromptId);
  }

  /**
   * Get all images ever uploaded (global registry)
   */
  getAllImages(): ImageRegistryEntry[] {
    return Array.from(this.globalImageRegistry.values());
  }

  /**
   * Check if a query is asking to describe all images
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
   * Get document context for a query
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
   * Clear old prompt contexts (keep last 50)
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
   * Clear all contexts and registries
   */
  clearAll(): void {
    this.promptContexts.clear();
    this.globalImageRegistry.clear();
    this.currentPromptId = null;
  }

  /**
   * Generate a unique prompt ID
   */
  private generatePromptId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics for debugging
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
