import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { dedupAndStore, Tender, closeStore } from "../lib/dedupe_and_testing/dedupe-pipeline";
import { Pool } from "pg";
import dotenv from "dotenv";
import { sendRfpEmail } from "../lib/email/resend";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Configure OpenRouter provider using OpenAI compatible endpoint
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "dummy-key",
  baseURL: 'https://openrouter.ai/api/v1',
});

const NIMBLOX_PROMPT = `
You are a procurement research analyst for Nimblox Inc., an Ottawa-based technology and management consultancy. Find OPEN, CURRENTLY-BIDDABLE RFPs, RFQs, RFIs and tenders that Nimblox can realistically win.

=== DATE FILTER (hard rule) ===
Only return opportunities whose submission deadline is AFTER today's date.
Discard anything closed, awarded, cancelled, or with an unverifiable deadline.
State today's date at the top of your answer.

=== WHO WE ARE (match against this) ===
Small Canadian consultancy (federal corp, Ottawa). Bilingual EN/FR. Delivery team of 2-4. WordPress/CMS specialists. Also do policy, template and report writing. Comfortable with AODA/WCAG 2.1 AA accessibility requirements. Typical contract size: $6,000 - $120,000 CAD. We do NOT bid on anything requiring bonding, security clearance, or 50+ person teams. We also do evertyhign writng like consultant preparation of RFPs, writing of kits, rewriting of technical dcoumentation

=== WHAT TO LOOK FOR ===
Solution categories (any of):
- Website redesign / development / migration (WordPress preferred)
- Member portals, intranets, resource hubs, searchable directories
- CMS implementation and content migration
- Accessibility audits and AODA/WCAG remediation
- Policy, procedure, template and toolkit development
- Report writing, editing, plain-language rewriting
- Digital strategy, needs assessment, engagement/consultation reviews

Buyer types (any of):
- Municipalities, counties, regional districts, townships
- Public libraries and library boards
- Nonprofits, NGOs, foundations, associations
- Indigenous organizations, First Nations, tribal councils, Indigenous financial institutions
- Universities, colleges, school boards
- Credit unions, CDFIs, community lenders
- Provincial agencies and Crown corporations

Geography, in priority order:
1. Ontario 2. Rest of Canada 3. United States 4. Global/remote nonprofits

Budget: $5,000 - $150,000 CAD (or USD equivalent). Include ones with no stated budget, but flag them.

=== WHERE TO SEARCH ===
Sweep public procurement portals and posting sites, including but not limited to: CanadaBuys, MERX, Biddingo, bids&tenders, Bonfire, Ontario Tenders Portal, BC Bid, SEAO, Alberta Purchasing Connection, individual municipal and library procurement pages, SAM.gov, and nonprofit/foundation RFP boards. Also check association and Indigenous-organization websites directly — many post RFPs only on their own site and never hit an aggregator. Those are our best odds.

=== EXCLUDE ===
- Staff augmentation / body-shop / standing-offer vendor rosters
- Anything demanding an existing government security clearance or bonding
- Enterprise platform builds (Salesforce, SAP, Drupal-at-scale, custom apps)
- Prequalification-only notices with no actual scope
- Anything already past its closing date

=== OUTPUT FORMAT ===
Return a single markdown table, one row per opportunity, sorted by deadline (soonest first). Use exactly these columns:
| Issuing Organization | RFP Title | Ref No. | Sector | Region/Province | Country | Solution Requested | Scope Summary (1 sentence) | Stated Budget | Currency | Deadline (YYYY-MM-DD) | Days Left | Submission Portal | Source URL |

Rules for the table:
- Every row must have a working Source URL to the live posting. No URL, no row.
- Write "Not stated" where a value isn't published. Never guess or infer a budget or deadline.
- Scope Summary must be one sentence, factual, no marketing language.
`;

function parseMarkdownTable(markdown: string): Tender[] {
  const lines = markdown.split("\n");
  let inTable = false;
  const tenders: Tender[] = [];
  
  for (const line of lines) {
    if (line.trim().startsWith("| Issuing Organization |")) {
      inTable = true;
      continue; // Skip header
    }
    if (inTable && line.trim().startsWith("|---")) {
      continue; // Skip separator
    }
    
    if (inTable && line.trim().startsWith("|")) {
      const parts = line.split("|").map((p) => p.trim());
      // parts[0] is empty because of leading |
      if (parts.length >= 14) {
        const urlMatch = parts[14].match(/\[.*?\]\((.*?)\)/) || [null, parts[14]];
        let sourceUrl = urlMatch[1] === "Not stated" ? "" : urlMatch[1];
        if (sourceUrl) {
            sourceUrl = sourceUrl.replace(/<\/?[^>]+(>|$)/g, ""); // remove html tags
        }
        
        if (!sourceUrl || sourceUrl === "Not stated") continue;

        tenders.push({
          source: "canadabuys", // Default fallback if can't determine
          sourceId: parts[3] !== "Not stated" ? parts[3] : `gen-${Date.now()}-${Math.random()}`,
          sourceUrl: sourceUrl,
          title: parts[2] !== "Not stated" ? parts[2] : "Unknown Title",
          buyerName: parts[1] !== "Not stated" ? parts[1] : undefined,
          bidNumber: parts[3] !== "Not stated" ? parts[3] : undefined,
          dueDate: parts[11] !== "Not stated" ? parts[11] : undefined,
          region: parts[5] !== "Not stated" ? parts[5] : undefined,
          currency: parts[10] !== "Not stated" ? parts[10] : "CAD",
          description: parts[8] !== "Not stated" ? parts[8] : undefined,
        });
      }
    } else if (inTable && !line.trim().startsWith("|")) {
      // End of table
      inTable = false;
    }
  }
  return tenders;
}

async function main() {
  console.log("Starting daily AI scraper for Nimblox...");

  // Generate RFPs using OpenRouter
  try {
    const { text } = await generateText({
      // DeepSeek via OpenRouter (or swap with any free model like google/gemini-2.5-flash-free)
      model: openrouter("deepseek/deepseek-chat"),
      prompt: NIMBLOX_PROMPT,
    });
    
    console.log("Generated text from AI:\n", text);
    
    const tenders = parseMarkdownTable(text);
    console.log(`Parsed ${tenders.length} tenders from AI response.`);

    if (tenders.length === 0) {
      console.log("No valid tenders found in table. Exiting.");
      return;
    }

    // Process and store in DB
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
    
    let newMatches = 0;
    for (const tender of tenders) {
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
          await sendRfpEmail(userEmail, tenders);
      } else {
          console.log("[Mock Email] Digest email would be sent to", userEmail);
      }
      console.log("Email processing finished.");
    }
    
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    await closeStore();
    await pool.end();
  }
}

main().catch(console.error);
