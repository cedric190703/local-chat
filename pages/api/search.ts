import { NextApiRequest, NextApiResponse } from 'next';
import { load } from 'cheerio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, numResults = 5 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query as string)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const html = await response.text();
    
    const $ = load(html);

    const results: Array<{ title: string, url: string, snippet: string }> = [];

    $('.result').each((i: number, element: any) => {
      if (i >= Number(numResults)) return false;

      const $element = $(element);
      const title = $element.find('.result__title a').text().trim();
      const url = $element.find('.result__title a').attr('href') || '';
      const snippet = $element.find('.result__snippet').text().trim();

      if (title && url && snippet) {
        results.push({ title, url, snippet });
      }
    });

    res.status(200).json({ results });
  } catch (error) {
  }
}