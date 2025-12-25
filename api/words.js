export default async function handler(req, res) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return res.status(500).json({ error: "Missing Airtable env vars." });
  }

  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}` +
    `?filterByFormula=${encodeURIComponent("{Active}=TRUE()")}`;

  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: "Airtable error", detail: text });
    }

    const data = await r.json();

    const words = (data.records || [])
      .map((rec) => ({
        word: rec.fields?.Word || "",
        meaning: rec.fields?.Meaning || "",
        sentence: rec.fields?.Sentence || "",
        emoji: rec.fields?.Emoji || "",
        room: rec.fields?.Room || 1,
      }))
      .filter((w) => w.word && w.meaning);

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ words });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
