export default async function handler(req, res) {
  try {
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Words";
    const API_KEY = process.env.AIRTABLE_API_KEY;

    if (!BASE_ID || !API_KEY) {
      return res.status(500).json({ error: "Missing Airtable env vars." });
    }

    // Only active words; you can add filters later if needed
    const url =
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}` +
      `?pageSize=200&filterByFormula=${encodeURIComponent("{Active}=TRUE()")}` +
      `&fields%5B%5D=Word&fields%5B%5D=Meaning&fields%5B%5D=Sentence&fields%5B%5D=Emoji&fields%5B%5D=Room`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: "Airtable error", detail: text });
    }

    const data = await r.json();

    const words = (data.records || [])
      .map(rec => ({
        word: rec.fields?.Word || "",
        meaning: rec.fields?.Meaning || "",
        sentence: rec.fields?.Sentence || "",
        emoji: rec.fields?.Emoji || "",
        room: rec.fields?.Room || 1,
      }))
      .filter(w => w.word && w.meaning);

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ words });

  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
