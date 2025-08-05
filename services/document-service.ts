import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export class DocumentProcessor {
  private documents: Map<string, DocumentChunk[]> = new Map();
  private documentIndex: Map<string, string[]> = new Map(); // Simple keyword index

  constructor() {
    // Simplified constructor without vector embeddings for now
  }

  async processDocument(fileName: string, content: string): Promise<DocumentChunk[]> {
    try {
      if (!content) {
        throw new Error('Content is required for document processing in browser environment');
      }
      
      const text = content;

      // Simple text chunking
      const chunks = this.splitText(text, 1000, 200);
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

  private splitText(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk.trim());
      start = end - chunkOverlap;
      
      if (start >= text.length) break;
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

  getDocumentList(): string[] {
    return Array.from(this.documents.keys());
  }

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

      const formattedResults = results.map((result: any, index: number) => 
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
