/**
 * @file This file contains the web search service for the local chat application.
 * It provides tools for searching the web and scraping web pages.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { load } from "cheerio";

/**
 * Represents a search result.
 */
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  detailedContent?: string;
}

const WebSearchInputSchema = z.object({
  query: z.string().describe("The search query to execute"),
  numResults: z.number().optional().default(5).describe("Number of results to return"),
});

/**
 * A tool for searching the web.
 */
export const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description: "Search the web for current information and return relevant results with detailed content",
  schema: WebSearchInputSchema,
  func: async (input: z.infer<typeof WebSearchInputSchema>): Promise<string> => {
    try {
      const { query, numResults } = input;

      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&numResults=${numResults}`);

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const { results } = (await response.json()) as { results: SearchResult[] };

      if (!results || results.length === 0) {
        return `No search results found for query: "${query}"`;
      }

      // Scrape each result for more detailed content
      const detailedResults = await Promise.all(results.map(async (result: SearchResult) => {
        try {
          const scrapedContent = await webScrapeTool.invoke({ url: result.url, maxLength: 500 });
          return {
            ...result,
            detailedContent: scrapedContent
          };
        } catch (error) {
          return {
            ...result,
            detailedContent: "Failed to scrape content."
          };
        }
      }));

      const formattedResults = detailedResults.map((result: SearchResult, index: number) =>
        `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   Summary: ${result.snippet}\n   Detailed Content: ${result.detailedContent}\n`
      ).join('\n');

      return `Search results for "${query}":\n\n${formattedResults}`;
    } catch (error) {
      console.error('Web search error:', error);
      return `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

const WebScrapeInputSchema = z.object({
  url: z.string().describe("The URL to scrape content from"),
  maxLength: z.number().optional().default(2000).describe("Maximum length of content to return"),
});

/**
 * A tool for scraping web pages.
 */
export const webScrapeTool = new DynamicStructuredTool({
  name: "web_scrape",
  description: "Scrape content from a specific web page URL with enhanced extraction",
  schema: WebScrapeInputSchema,
  func: async (input: z.infer<typeof WebScrapeInputSchema>): Promise<string> => {
    try {
      const { url, maxLength } = input;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      const html = await response.text();
      const $ = load(html);

      // Remove script and style elements
      $('script, style, nav, header, footer, aside').remove();

      // Extract main content with priority
      let content = '';
      const contentSelectors = [
        'main', 
        'article', 
        '.content', 
        '#content', 
        '.post', 
        '.entry',
        '.main-content',
        '#main-content'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }

      // Fallback to body if no main content found
      if (!content) {
        content = $('body').text();
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
      }

      return `Content from ${url}:\n\n${content}`;
    } catch (error) {
      console.error('Web scraping error:', error);
      return `Error scraping URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// Example usage (for testing)
// async function main() {
//   const searchResults = await webSearchTool.invoke({ query: "latest AI news", numResults: 3 });
//   console.log(searchResults);
// }

// main();
