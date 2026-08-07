import { NextResponse } from 'next/server';
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { dedupAndStore, Tender } from "@/lib/dedupe_and_testing/dedupe-pipeline";
import { Pool } from "pg";
import { sendRfpEmail } from "@/lib/email/resend";
import { mem0Recall } from "@/lib/mem0";

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
               .substring(0, 20000);
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
        days: 3
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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "dummy-key",
    baseURL: 'https://openrouter.ai/api/v1',
  });

  try {
    const client = await pool.connect();
    
    const res = await client.query('SELECT id, email FROM "user" LIMIT 1');
    if (res.rows.length === 0) {
      client.release();
      await pool.end();
      return NextResponse.json({ success: false, message: "No users in database." });
    }
    const userId = res.rows[0].id;
    const userEmail = res.rows[0].email;

    let searchContext = "website design, software development, RFP in Canada";
    try {
      if (process.env.MEM0_API_KEY) {
        const memories = await mem0Recall({ userId, query: "What kind of RFPs and locations does the user want?", limit: 3 });
        if (memories && memories.length > 0) {
          searchContext = memories.map((m: any) => m.memory).join(". ");
        }
      }
    } catch (e) {
      console.log("Mem0 recall failed", e);
    }

    const tavilyQuery = `Open RFP tender request for proposal ${searchContext} ${new Date().getFullYear()}`;
    const targetUrls = await tavilySearch(tavilyQuery);

    const allTenders: Tender[] = [];

    for (const url of targetUrls) {
      const htmlText = await fetchHtml(url);
      if (!htmlText || htmlText.length < 500) continue;

      try {
        const aiModel = process.env.OPENROUTER_MODEL || "qwen/qwen-2.5-72b-instruct:free";
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

    if (allTenders.length === 0) {
      client.release();
      await pool.end();
      return NextResponse.json({ success: true, matches: 0, message: "No valid tenders found." });
    }
    
    let newMatches = 0;
    for (const tender of allTenders) {
      await dedupAndStore(tender);
      
      const fingerprintRes = await client.query("SELECT id FROM rfps WHERE source_url = $1 LIMIT 1", [tender.sourceUrl]);
      if (fingerprintRes.rows.length > 0) {
        const rfpId = fingerprintRes.rows[0].id;
        
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

    if (newMatches > 0) {
      await sendRfpEmail(userEmail, allTenders);
    }
    
    return NextResponse.json({ success: true, matches: newMatches });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
