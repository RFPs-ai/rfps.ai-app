import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { dedupAndStore, Tender, closeStore } from "../lib/dedupe_and_testing/dedupe-pipeline";
import { Pool } from "pg";
import { sendRfpEmail } from "../lib/email/resend";
import { mem0Recall } from "../lib/mem0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "dummy-key",
  baseURL: 'https://openrouter.ai/api/v1',
});

const EXTRACTION_PROMPT = `
You are a procurement research analyst for Nimblox Inc., an Ottawa-based technology and management consultancy.
You are given the raw HTML text of a web page that contains an RFP (Request for Proposal), tender, or bid opportunity.

Extract the details of the RFP into a clean JSON object with the following fields:
- "title": The title of the RFP (e.g., "Website Redesign")
- "buyerName": The issuing organization (e.g., "Cloverdale Rodeo")
- "bidNumber": The reference or bid number (if stated, otherwise null)
- "dueDate": The submission deadline in YYYY-MM-DD format (if stated, otherwise null)
- "region": The city, province, or region (if stated, otherwise null)
- "currency": The currency (e.g., "CAD", "USD")
- "description": A short 1-3 sentence summary of the project scope.

Only return valid JSON format. Return an array of objects if there are multiple RFPs on the page, but usually it will just be one.
Ensure your response starts with \`[\` and ends with \`]\`.
`;

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const html = await response.text();
    return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s+/g, ' ')
               .substring(0, 20000); // 20k chars is plenty for Gemini flash
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return "";
  }
}

async function tavilySearch(query: string): Promise<string[]> {
  if (!process.env.TAVILY_API_KEY) {
    console.log("No TAVILY_API_KEY found, falling back to static URL.");
    return ["https://cloverdalerodeo.com/2026/07/17/rfp-website-redesign-26-07-web/"];
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        max_results: 5,
        days: 3 // Only very recent postings
      })
    });
    
    if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
    
    const data = await res.json();
    if (data && data.results) {
      return data.results.map((r: any) => r.url);
    }
    return [];
  } catch (error) {
    console.error("Tavily search failed:", error);
    return ["https://cloverdalerodeo.com/2026/07/17/rfp-website-redesign-26-07-web/"];
  }
}

async function main() {
  console.log("Starting daily AI scraper for real RFPs...");

  const client = await pool.connect();
  
  // Find Nimblox user (or fallback to the first user for demo purposes)
  const res = await client.query('SELECT id, email FROM "user" LIMIT 1');
  if (res.rows.length === 0) {
    console.log("No users in database to associate RFPs with.");
    client.release();
    return;
  }
  const userId = res.rows[0].id;
  const userEmail = res.rows[0].email;

  // 1. Fetch User Preferences from Mem0
  let searchContext = "website design, software development, RFP in Canada";
  try {
    if (process.env.MEM0_API_KEY) {
      const memories = await mem0Recall({ userId, query: "What kind of RFPs and locations does the user want?", limit: 3 });
      if (memories && memories.length > 0) {
        searchContext = memories.map((m: any) => m.memory).join(". ");
        console.log("Retrieved Mem0 preferences:", searchContext);
      }
    }
  } catch (e) {
    console.log("Mem0 recall failed or not configured, using default context.", e);
  }

  // 2. Search Tavily for URLs based on Mem0 context
  const tavilyQuery = `Open RFP tender request for proposal ${searchContext} ${new Date().getFullYear()}`;
  console.log("Tavily Search Query:", tavilyQuery);
  const targetUrls = await tavilySearch(tavilyQuery);
  console.log(`Tavily found ${targetUrls.length} URLs to scrape.`);

  const allTenders: Tender[] = [];

  // 3. Scrape and Extract with OpenRouter (Gemini Flash Free)
  for (const url of targetUrls) {
    console.log(`Scraping: ${url}`);
    const htmlText = await fetchHtml(url);
    if (!htmlText || htmlText.length < 500) {
      console.log(`Skipping ${url}, insufficient content.`);
      continue;
    }

    console.log(`Extracting data with AI (Gemini 2.5 Flash Free)...`);
    try {
      const aiModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-free";
      const { text } = await generateText({
        model: openrouter(aiModel),
        prompt: `${EXTRACTION_PROMPT}\n\n=== RAW CONTENT ===\n${htmlText}`,
      });
      
      const cleanJsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const extractedArray = JSON.parse(cleanJsonStr);

      if (Array.isArray(extractedArray)) {
        for (const item of extractedArray) {
          if (!item.title || item.title === "Unknown RFP") continue;
          
          allTenders.push({
            source: "AI Web Scraper",
            sourceId: item.bidNumber || `ai-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sourceUrl: url,
            title: item.title,
            buyerName: item.buyerName,
            bidNumber: item.bidNumber,
            dueDate: item.dueDate,
            region: item.region,
            currency: item.currency || "CAD",
            description: item.description,
          });
        }
      }
    } catch (error) {
      console.error(`Error parsing AI output for ${url}:`, error);
    }
  }

  console.log(`Extracted ${allTenders.length} tenders total.`);

  if (allTenders.length === 0) {
    console.log("No valid tenders found. Exiting.");
    client.release();
    await pool.end();
    return;
  }

  let newMatches = 0;
  for (const tender of allTenders) {
    const status = await dedupAndStore(tender);
    
    // Get the fingerprint to link to the user
    const fingerprintRes = await client.query("SELECT id FROM rfps WHERE source_url = $1 LIMIT 1", [tender.sourceUrl]);
    if (fingerprintRes.rows.length > 0) {
      const rfpId = fingerprintRes.rows[0].id;
      
      // Ensure userRfp exists
      const userRfpCheck = await client.query("SELECT id FROM user_rfps WHERE user_id = $1 AND rfp_id = $2", [userId, rfpId]);
      if (userRfpCheck.rows.length === 0) {
        await client.query(
          "INSERT INTO user_rfps (user_id, rfp_id, status, relevance_score) VALUES ($1, $2, 'new', 95)",
          [userId, rfpId]
        );
        newMatches++;
      }
    }
  }
  
  client.release();
  console.log(`Inserted ${newMatches} new matches for user ${userId}`);

  // Send email digest if new matches found
  if (newMatches > 0) {
    console.log("Sending email digest...");
    if (typeof sendRfpEmail === "function") {
        await sendRfpEmail(userEmail, allTenders);
    }
  }
  
  await closeStore();
  await pool.end();
}

main().catch(console.error);
