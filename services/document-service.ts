/**
 * @file This file contains the document processing service for the local chat application.
 * It provides tools for processing, searching, and managing documents.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Represents a chunk of a document.
 */
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

/**
 * A class for processing documents.
 */
export class DocumentProcessor {
  private documents: Map<string, DocumentChunk[]> = new Map();
  private documentIndex: Map<string, string[]> = new Map(); // Simple keyword index

  constructor() {
    // Simplified constructor without vector embeddings for now
  }

  /**
   * Processes a document and returns the chunks.
   * @param fileName The name of the file to process.
   * @param content The content of the file to process.
   * @returns The chunks of the document.
   */
  async processDocument(fileName: string, content: string): Promise<DocumentChunk[]> {
    try {
      if (!content) {
        throw new Error('Content is required for document processing in browser environment');
      }
      
      // Validate content is actually text and not binary data
      if (this.isBinaryContent(content)) {
        // For binary files, create a simple reference chunk
        const documentChunks: DocumentChunk[] = [{
          id: `${fileName}-chunk-0`,
          content: `File: ${fileName} (binary content - not processed for text search)`,
          metadata: {
            source: fileName,
            chunkIndex: 0,
            totalChunks: 1,
          },
        }];
        
        this.documents.set(fileName, documentChunks);
        this.buildSimpleIndex(fileName, documentChunks);
        return documentChunks;
      }
      
      const text = content;

      // Handle different file types with appropriate chunking strategies
      let chunks: string[];
      
      if (text.startsWith('IMAGE_FILE:')) {
        // For images, don't chunk the base64 data - create a single chunk with metadata only
        const lines = text.split('\n');
        const metadataLines = lines.slice(0, 5); // First 5 lines contain metadata
        const imageMetadata = metadataLines.join('\n') + '\n[Base64 image data available for vision models]';
        chunks = [imageMetadata];
      } else if (text.startsWith('BINARY_FILE:')) {
        // For binary files, just use the metadata
        chunks = [text];
      } else if (text.startsWith('DOCUMENT_FILE:')) {
        // For document files, extract content and chunk appropriately
        const contentStart = text.indexOf('Content:\n');
        if (contentStart !== -1) {
          const metadata = text.substring(0, contentStart + 9);
          const actualContent = text.substring(contentStart + 9);
          
          // Chunk the actual content, but keep chunks reasonable for large files
          const maxChunkSize = Math.min(1000, Math.max(500, Math.floor(actualContent.length / 50)));
          const contentChunks = this.splitText(actualContent, maxChunkSize, 200);
          
          // Add metadata to first chunk, content to subsequent chunks
          chunks = contentChunks.map((chunk, index) => 
            index === 0 ? metadata + chunk : chunk
          );
        } else {
          chunks = this.splitText(text, 1000, 200);
        }
      } else {
        // Regular text chunking for other content
        chunks = this.splitText(text, 1000, 200);
      }
      const documentChunks: DocumentChunk[] = chunks.map((chunk: string, index: number) => ({
        id: `${fileName}-chunk-${index}`,
        content: chunk,
        metadata: {
          source: fileName,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      }));

      this.documents.set(fileName, documentChunks);
      this.buildSimpleIndex(fileName, documentChunks);
      
      return documentChunks;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  // Note: for binary parsing, use a server API. Browser fallback is handled in upload hook.

  private isBinaryContent(content: string): boolean {
    // Check for null bytes or other binary indicators
    if (content.includes('\0')) return true;
    
    // Check for high percentage of non-printable characters
    const nonPrintableCount = content.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code < 32 && code !== 9 && code !== 10 && code !== 13; // Allow tab, newline, carriage return
    }).length;
    
    const nonPrintableRatio = nonPrintableCount / content.length;
    return nonPrintableRatio > 0.1; // If more than 10% non-printable, consider binary
  }

  private splitText(text: string, chunkSize: number, chunkOverlap: number): string[] {
    // Safety checks to prevent RangeError
    if (!text || text.length === 0) {
      return [];
    }
    
    // Limit maximum text size to prevent memory issues
    const MAX_TEXT_SIZE = 1024 * 1024; // 1MB limit
    if (text.length > MAX_TEXT_SIZE) {
      console.warn(`Text too large (${text.length} chars), truncating to ${MAX_TEXT_SIZE} chars`);
      text = text.substring(0, MAX_TEXT_SIZE);
    }
    
    // Ensure reasonable chunk parameters
    chunkSize = Math.max(100, Math.min(chunkSize, 5000));
    chunkOverlap = Math.max(0, Math.min(chunkOverlap, chunkSize / 2));
    
    const chunks: string[] = [];
    let start = 0;
    
    // Prevent infinite loops
    let iterations = 0;
    const maxIterations = Math.ceil(text.length / (chunkSize - chunkOverlap)) + 10;
    
    while (start < text.length && iterations < maxIterations) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
      
      start = end - chunkOverlap;
      
      // Ensure we're making progress
      if (start <= end - chunkSize && end < text.length) {
        start = end;
      }
      
      if (start >= text.length) break;
      iterations++;
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  private buildSimpleIndex(fileName: string, chunks: DocumentChunk[]): void {
    const keywords: string[] = [];
    
    chunks.forEach(chunk => {
      // Extract keywords (simple approach)
      const words = chunk.content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);
      keywords.push(...words);
    });
    
    this.documentIndex.set(fileName, [...new Set(keywords)]);
  }

  /**
   * Searches the documents for a given query.
   * @param query The query to search for.
   * @param k The number of results to return.
   * @returns The search results.
   */
  async searchDocuments(query: string, k: number = 5): Promise<DocumentChunk[]> {
    const queryWords = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const results: Array<{chunk: DocumentChunk, score: number}> = [];
    
    // Simple keyword-based search
    for (const [fileName, chunks] of this.documents.entries()) {
      const keywords = this.documentIndex.get(fileName) || [];
      
      chunks.forEach(chunk => {
        let score = 0;
        const chunkWords = chunk.content.toLowerCase();
        
        queryWords.forEach(word => {
          if (chunkWords.includes(word)) {
            score += 1;
          }
        });
        
        if (score > 0) {
          results.push({ chunk, score });
        }
      });
    }
    
    // Sort by score and return top k
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(result => result.chunk);
  }

  /**
   * Gets a list of all the documents.
   * @returns A list of all the documents.
   */
  getDocumentList(): string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Removes a document.
   * @param fileName The name of the file to remove.
   * @returns Whether the document was removed.
   */
  removeDocument(fileName: string): boolean {
    const removed = this.documents.delete(fileName);
    if (removed) {
      this.documentIndex.delete(fileName);
    }
    return removed;
  }
}

const DocumentSearchInputSchema = z.object({
  query: z.string().describe("The search query to find relevant document chunks"),
  maxResults: z.number().optional().default(5).describe("Maximum number of results to return"),
});

/**
 * Creates a document search tool.
 * @param processor The document processor to use.
 * @returns A document search tool.
 */
export const createDocumentSearchTool = (processor: DocumentProcessor) => new DynamicStructuredTool({
  name: "document_search",
  description: "Search through uploaded documents to find relevant information",
  schema: DocumentSearchInputSchema,
  func: async (input: z.infer<typeof DocumentSearchInputSchema>): Promise<string> => {
    try {
      const { query, maxResults } = input;
      const results = await processor.searchDocuments(query, maxResults);

      if (results.length === 0) {
        return `No relevant documents found for query: "${query}"`;
      }

      const formattedResults = results.map((result: DocumentChunk, index: number) => 
        `${index + 1}. **Source:** ${result.metadata.source} (Chunk ${result.metadata.chunkIndex + 1}/${result.metadata.totalChunks})\n` +
        `   **Content:** ${result.content.substring(0, 300)}${result.content.length > 300 ? '...' : ''}\n`
      ).join('\n');

      return `Document search results for "${query}":\n\n${formattedResults}`;
    } catch (error) {
      console.error('Document search error:', error);
      return `Error searching documents: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

const DocumentUploadInputSchema = z.object({
  fileName: z.string().describe("Name of the document file to process"),
  content: z.string().describe("Text content of the document"),
});

/**
 * Creates a document upload tool.
 * @param processor The document processor to use.
 * @returns A document upload tool.
 */
export const createDocumentUploadTool = (processor: DocumentProcessor) => new DynamicStructuredTool({
  name: "document_upload",
  description: "Process and index a document for future searches",
  schema: DocumentUploadInputSchema,
  func: async (input: z.infer<typeof DocumentUploadInputSchema>): Promise<string> => {
    try {
      const { fileName, content } = input;
      const chunks = await processor.processDocument(fileName, content);
      
      return `Successfully processed document "${fileName}" into ${chunks.length} chunks. The document is now searchable.`;
    } catch (error) {
      console.error('Document upload error:', error);
      return `Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// Singleton instance
export const documentProcessor = new DocumentProcessor();