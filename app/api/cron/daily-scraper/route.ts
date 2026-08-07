import { NextResponse } from 'next/server';
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { dedupAndStore, Tender } from "@/lib/dedupe_and_testing/dedupe-pipeline";
import { Pool } from "pg";
import { sendRfpEmail } from "@/lib/email/resend";
import { mem0Recall } from "@/lib/mem0";

const EXTRACTION_PROMPT = `
You are a procurement research analyst.
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
    if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);
    const html = await response.text();
    return html.replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, '')
               .replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\\s+/g, ' ')
               .substring(0, 20000);
  } catch (error) {
    console.error(\`Failed to fetch \${url}:\`, error);
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
    
    if (!res.ok) throw new Error(\`Tavily error: \${res.status}\`);
    
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
  if (process.env.CRON_SECRET && authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
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
    // PHASE 1: GLOBAL SCRAPING
    const searchQueries = [
      \`Open RFP tender request for proposal website design Canada \${new Date().getFullYear()}\`,
      \`Open RFP tender request for proposal software development \${new Date().getFullYear()}\`,
      \`Open RFP tender request for proposal IT consulting \${new Date().getFullYear()}\`
    ];

    const targetUrls = new Set<string>();
    for (const query of searchQueries) {
      const urls = await tavilySearch(query);
      urls.forEach(u => targetUrls.add(u));
    }

    const allTenders: Tender[] = [];

    for (const url of Array.from(targetUrls)) {
      const htmlText = await fetchHtml(url);
      if (!htmlText || htmlText.length < 500) continue;

      try {
        const aiModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
        const { text } = await generateText({
          model: openrouter(aiModel),
          prompt: \`\${EXTRACTION_PROMPT}\\n\\n=== RAW CONTENT ===\\n\${htmlText}\`,
        });
        
        const cleanJsonStr = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
        const extractedArray = JSON.parse(cleanJsonStr);

        if (Array.isArray(extractedArray)) {
          for (const item of extractedArray) {
            if (!item.title || item.title === "Unknown RFP") continue;
            
            allTenders.push({
              source: "AI Web Scraper",
              sourceId: item.bidNumber || \`ai-gen-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
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
        console.error(\`Error parsing AI output for \${url}:\`, error);
      }
    }

    if (allTenders.length === 0) {
      await pool.end();
      return NextResponse.json({ success: true, message: "No valid tenders found globally." });
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

    if (newScrapedRfps.length === 0) {
      await pool.end();
      return NextResponse.json({ success: true, message: "No new RFPs inserted today." });
    }

    // PHASE 2: INTELLIGENT MATCHMAKING
    const client = await pool.connect();
    
    const usersRes = await client.query('SELECT id, email FROM "user"');
    if (usersRes.rows.length === 0) {
      client.release();
      await pool.end();
      return NextResponse.json({ success: true, message: "No users to match against." });
    }

    let totalNewMatches = 0;

    for (const user of usersRes.rows) {
      let searchContext = "general technology procurement";
      
      try {
        if (process.env.MEM0_API_KEY) {
          const memories = await mem0Recall({ userId: user.id, query: "What kind of RFPs and locations does the user want?", limit: 5 });
          if (memories && memories.length > 0) {
            searchContext = memories.map((m: any) => m.memory).join(". ");
          }
        }
      } catch (e) {
        console.log("Mem0 recall failed", e);
      }

      try {
        const aiModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
        const { text } = await generateText({
          model: openrouter(aiModel),
          prompt: \`\${MATCHMAKING_PROMPT}\\n\\n=== USER PROFILE ===\\n\${searchContext}\\n\\n=== NEW RFPS ===\\n\${JSON.stringify(newScrapedRfps, null, 2)}\`,
        });

        const cleanJsonStr = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
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
              totalNewMatches++;

              const fullTender = allTenders.find(t => newScrapedRfps.find(nr => nr.id === rfpId && nr.title === t.title));
              if (fullTender) emailTenders.push(fullTender);
            }
          }
        }

        if (userNewMatches > 0 && typeof sendRfpEmail === "function") {
          await sendRfpEmail(user.email, emailTenders);
        }
      } catch (err) {
        console.error(\`Failed to evaluate matches for \${user.email}:\`, err);
      }
    }
    
    client.release();
    return NextResponse.json({ success: true, globalScraped: allTenders.length, newMatches: totalNewMatches });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
