export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { cvText, jobRole, selectedType } = req.body;

    if (!cvText || cvText.length < 50) {
      return res.status(400).json({ error: "CV text missing or too short" });
    }

    const typeMap = {
      full: "Provide a comprehensive review covering all aspects.",
      quick: "Focus on top 3 strengths and top 3 most urgent improvements only.",
      ats: "Focus on ATS optimisation: keywords, formatting issues, and missing terms."
    };

    const jobCtx = jobRole
      ? `Target role: ${jobRole}.`
      : "No target role — give general advice.";

    const prompt = `You are a senior CV reviewer and recruiter. ${jobCtx}

Analyse this CV and return ONLY a raw JSON object — no markdown, no code fences, no extra text.

Use exactly this format:
{"score":75,"scoreLabel":"Good","summary":"2-3 sentence summary.","strengths":["s1","s2","s3","s4"],"improvements":["i1","i2","i3","i4"],"quickWins":["w1","w2","w3"],"keywords":["k1","k2","k3","k4"]}

scoreLabel must be one of: Poor, Needs Work, Good, Strong, Excellent
${typeMap[selectedType]}

CV:
${cvText.substring(0, 6000)}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return res.status(500).json({ error: errText });
    }

    const data = await claudeRes.json();
    const raw = data.content.map(b => b.text || "").join("").trim();
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "No JSON found in Claude response" });
    }

    const result = JSON.parse(match[0]);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
