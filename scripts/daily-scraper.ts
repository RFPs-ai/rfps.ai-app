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
You are a procurement research analyst for RFPs.ai, an automated RFP discovery platform.
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
`;

const MATCHMAKING_PROMPT = `
You are an expert procurement matchmaker.
I will give you a User Profile (representing what the user does and what kind of RFPs they are looking for).
I will also give you a list of NEW RFPs that were just scraped.

Evaluate each RFP against the User Profile.
Return a JSON array of objects, one for each RFP, with the following fields:
- "rfpId": The EXACT id string of the RFP provided.
- "score": A relevance score from 0 to 100 indicating how well it matches the User Profile.
- "relevant": true if the score is >= 75, false otherwise.
- "reason": A very short 1-sentence explanation of why it matches or doesn't match.
`;

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("HTTP error: " + response.status);
    const html = await response.text();
    return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s+/g, ' ')
               .substring(0, 20000);
  } catch (error) {
    console.error("Failed to fetch " + url + ":", error);
    return "";
  }
}

async function tavilySearch(query: string): Promise<string[]> {
  if (!process.env.TAVILY_API_KEY) {
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
        max_results: 3,
        days: 3
      })
    });
    
    if (!res.ok) throw new Error("Tavily error: " + res.status);
    
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
  console.log("Starting daily AI scraper (Phase 1: Global Scrape)...");

  // PHASE 1: GLOBAL SCRAPING
  const year = new Date().getFullYear();
  const searchQueries = [
    "Open RFP tender request for proposal website design Canada " + year,
    "Open RFP tender request for proposal software development " + year,
    "Open RFP tender request for proposal IT consulting " + year
  ];

  const targetUrls = new Set<string>();
  for (const query of searchQueries) {
    console.log("Searching Tavily: " + query);
    const urls = await tavilySearch(query);
    urls.forEach(u => targetUrls.add(u));
  }

  console.log("Tavily found " + targetUrls.size + " unique URLs to scrape.");

  const allTenders: Tender[] = [];

  for (const url of Array.from(targetUrls)) {
    console.log("Scraping: " + url);
    const htmlText = await fetchHtml(url);
    if (!htmlText || htmlText.length < 500) {
      console.log("Skipping " + url + ", insufficient content.");
      continue;
    }

    console.log("Extracting data with AI (Gemini 2.5 Flash)...");
    try {
      const aiModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
      const { text } = await generateText({
        model: openrouter(aiModel),
        prompt: EXTRACTION_PROMPT + "\n\n=== RAW CONTENT ===\n" + htmlText,
      });
      
      const cleanJsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const extractedArray = JSON.parse(cleanJsonStr);

      if (Array.isArray(extractedArray)) {
        for (const item of extractedArray) {
          if (!item.title || item.title === "Unknown RFP") continue;
          
          allTenders.push({
            source: "AI Web Scraper",
            sourceId: item.bidNumber || ("ai-gen-" + Date.now() + "-" + Math.floor(Math.random() * 1000)),
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
      console.error("Error parsing AI output for " + url + ":", error);
    }
  }

  console.log("Extracted " + allTenders.length + " tenders globally.");

  if (allTenders.length === 0) {
    console.log("No valid tenders found globally. Exiting.");
    await closeStore();
    await pool.end();
    return;
  }

  const newScrapedRfps: any[] = [];

  for (const tender of allTenders) {
    const { status, id } = await dedupAndStore(tender);
    if (status === "NEW") {
      newScrapedRfps.push({
        id,
        title: tender.title,
        description: tender.description,
        buyerName: tender.buyerName,
      });
    }
  }

  console.log("Inserted " + newScrapedRfps.length + " completely NEW RFPs into the database.");

  if (newScrapedRfps.length === 0) {
    console.log("No new RFPs to match today. Exiting.");
    await closeStore();
    await pool.end();
    return;
  }

  // PHASE 2: INTELLIGENT MATCHMAKING
  console.log("Starting Phase 2: Intelligent Matchmaking...");
  const client = await pool.connect();
  
  const usersRes = await client.query('SELECT id, email FROM "user"');
  if (usersRes.rows.length === 0) {
    console.log("No users in database. Skipping matchmaking.");
    client.release();
    await closeStore();
    await pool.end();
    return;
  }

  for (const user of usersRes.rows) {
    console.log("Evaluating matches for user " + user.email + " (" + user.id + ")...");
    let searchContext = "general technology procurement";
    
    try {
      if (process.env.MEM0_API_KEY) {
        const memories = await mem0Recall({ userId: user.id, query: "What kind of RFPs and locations does the user want?", limit: 5 });
        if (memories && memories.length > 0) {
          searchContext = memories.map((m: any) => m.memory).join(". ");
          console.log("  - Mem0 Profile: " + searchContext);
        } else {
          console.log("  - No Mem0 profile found, using fallback.");
        }
      }
    } catch (e) {
      console.log("  - Mem0 recall failed", e);
    }

    try {
      const aiModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
      const { text } = await generateText({
        model: openrouter(aiModel),
        prompt: MATCHMAKING_PROMPT + "\n\n=== USER PROFILE ===\n" + searchContext + "\n\n=== NEW RFPS ===\n" + JSON.stringify(newScrapedRfps, null, 2),
      });

      const cleanJsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const evaluations = JSON.parse(cleanJsonStr);

      let userNewMatches = 0;
      const emailTenders: Tender[] = [];

      for (const evalResult of evaluations) {
        if (evalResult.relevant && evalResult.score >= 75) {
          const rfpId = evalResult.rfpId;
          
          const userRfpCheck = await client.query("SELECT id FROM user_rfps WHERE user_id = $1 AND rfp_id = $2", [user.id, rfpId]);
          if (userRfpCheck.rows.length === 0) {
            await client.query(
              "INSERT INTO user_rfps (user_id, rfp_id, status, relevance_score) VALUES ($1, $2, 'new', $3)",
              [user.id, rfpId, evalResult.score]
            );
            userNewMatches++;

            const fullTender = allTenders.find(t => newScrapedRfps.find((nr: any) => nr.id === rfpId && nr.title === t.title));
            if (fullTender) emailTenders.push(fullTender);
          }
        }
      }

      console.log("  - Matched " + userNewMatches + " RFPs for " + user.email);

      if (userNewMatches > 0 && typeof sendRfpEmail === "function") {
        console.log("  - Sending email digest to " + user.email);
        await sendRfpEmail(user.email, emailTenders);
      }

    } catch (err) {
      console.error("  - Failed to evaluate matches for " + user.email + ":", err);
    }
  }
  
  client.release();
  await closeStore();
  await pool.end();
}

main().catch(console.error);
