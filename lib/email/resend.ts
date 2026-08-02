import { Resend } from 'resend';
import { Tender } from '../dedupe_and_testing/dedupe-pipeline';

// Fallback to a mock instance if no API key is provided
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export async function sendRfpEmail(toEmail: string, tenders: Tender[]) {
  if (!resend) {
    console.log(`[Mock Resend] Would send email to ${toEmail} with ${tenders.length} RFPs.`);
    console.log("[Mock Resend] Tenders:");
    tenders.forEach(t => console.log(` - ${t.title} (${t.sourceUrl})`));
    return;
  }

  const htmlContent = `
    <h1>Daily RFP Matches</h1>
    <p>We found ${tenders.length} new RFPs that match your profile.</p>
    <ul>
      ${tenders.map(tender => `
        <li>
          <strong><a href="${tender.sourceUrl}">${tender.title}</a></strong><br/>
          Buyer: ${tender.buyerName || 'Unknown'}<br/>
          Deadline: ${tender.dueDate || 'Unknown'}<br/>
          ${tender.description ? `<p>${tender.description}</p>` : ''}
        </li>
      `).join('')}
    </ul>
    <p><a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'}/matches">View all your matches here</a></p>
  `;

  try {
    const data = await resend.emails.send({
      from: 'RFPs.ai <matches@rfps.ai>',
      to: [toEmail],
      subject: `Your Daily RFP Matches - ${tenders.length} Found`,
      html: htmlContent,
    });
    console.log("Email sent successfully:", data);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
