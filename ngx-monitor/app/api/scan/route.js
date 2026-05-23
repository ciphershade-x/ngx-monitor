export const runtime = "edge";

const SYSTEM_PROMPT = `You are a Nigerian capital market analyst monitoring the NGX (Nigerian Exchange Group) for stock offerings.

You will search for and identify ALL current or upcoming stock offerings including:
- IPOs (Initial Public Offerings)
- Rights Issues
- Public Offers / Offers for Subscription
- Bond Offerings
- Commercial Paper Listings
- ETF launches
- Any new listings or capital-raising activities on NGX

For each offering found, extract:
1. Company name
2. Type (IPO / Rights Issue / Public Offer / Bond / ETF / Other)
3. Status (Open / Upcoming / Closed / Recently Listed)
4. Key dates if available (opening date, closing date)
5. Price / offer details if available
6. Brief description (1-2 sentences)

Respond ONLY in valid JSON with this exact structure, no markdown, no backticks:
{
  "offerings": [
    {
      "id": "unique_slug_no_spaces",
      "company": "Company Name",
      "type": "IPO|Rights Issue|Public Offer|Bond|ETF|Other",
      "status": "Open|Upcoming|Closed|Recently Listed",
      "openDate": "DD MMM YYYY or null",
      "closeDate": "DD MMM YYYY or null",
      "price": "₦X.XX or null",
      "description": "Brief description",
      "source": "source name"
    }
  ],
  "marketSummary": "1-2 sentence summary of current NGX capital market activity",
  "dataNote": "Any caveat about data freshness or limitations"
}`;

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const today = new Date().toISOString();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: {
            text: SYSTEM_PROMPT,
          },
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Today is ${today}.

Search for current NGX (Nigerian Exchange Group) stock offerings. Search for:
1. "NGX IPO 2025 Nigeria" 
2. "NGX rights issue offer subscription 2025"
3. "invest.ngxgroup.com offerings"
4. "Nigeria stock exchange public offer 2025"

Then list every active or upcoming offering you can find including:
- Bank recapitalization rights issues (Access Bank, Fidelity, FCMB, UBA, etc.)
- Any announced IPOs
- Bond offerings on NGX
- ETF launches
- Any public offers for subscription

Be thorough and current. Return only valid JSON.`,
              },
            ],
          },
        ],
        generation_config: {
          max_output_tokens: 4000,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `Upstream error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return Response.json({ error: "No text response from model" }, { status: 502 });
    }

    let raw = textContent.trim();
    raw = raw.replace(/```json|```/g, "").trim();

    // Extract JSON object if wrapped in other text
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "Could not parse JSON from response" }, { status: 502 });
    }

    const parsed = JSON.parse(match[0]);
    parsed.scannedAt = new Date().toISOString();
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
