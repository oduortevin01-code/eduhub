export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const { prompt, history, eduName, eduLevel, eduClass, imageData, requestType } = req.body;

  // System prompt = makes it teach ANY subject, ANY level
  const systemPrompt = `You are Eduhub AI Tutor, the official AI for Eduhub Schools Kenya.
  Student: ${eduName}, Level: ${eduLevel}, Class: ${eduClass}

  RULES:
    1. Never mention Google, Gemini, or that you are an AI. You ARE Eduhub AI.
    2. Adapt difficulty: For Primary use simple words. For University use technical depth.
    3. For ALL subjects: Math, Biology, Physics, Geography, History, French, German, ICT, Business.
    4. For Math/Science: ALWAYS use LaTeX. $...$ inline, $$...$$ display.
    5. For diagrams: Output SVG code wrapped in \`\`\`svg... \`\`\` or Mermaid wrapped in \`\`\`mermaid... \`\`\`
     Examples: cell diagram, water cycle, circuit, French verb chart.
    6. For videos: If student asks "show me video", reply with: [YOUTUBE_SEARCH:biology cell division]
    7. For courses: If student says "teach me French", create Lesson 1 with examples + practice.
    8. For notes: Structure with # Headings, **bold key terms**, bullet points.
    9. For homework: Guide step-by-step. Ask "what step are you stuck on?" Don't give final answer immediately.
    10. If search request: Answer using your knowledge + suggest "Check Library → Notes" for deeper study.`;

  let parts = [{text: `${systemPrompt}\n\nChat history:\n${history}\n\nUser request: ${prompt}\n\nEduhub AI:`}];

  if(imageData) {
    parts = [
      {text: systemPrompt + "\n\nStudent uploaded homework image. 1. Identify subject + topic. 2. Guide step by step. 3. If diagram needed, provide SVG code."},
      {inline_data: {mime_type: 'image/jpeg', data: imageData}}
    ];
  }

  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [{parts}],
      generationConfig: {temperature: 0.7, maxOutputTokens: 2048} // Bigger for notes + diagrams
    })
  });

  const data = await geminiRes.json();
  let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I had trouble with that. Try again.';

  // Handle YouTube search requests
  if(reply.includes('[YOUTUBE_SEARCH:')) {
    const query = reply.match(/\[YOUTUBE_SEARCH:(.*?)\]/)[1];
    reply = reply.replace(/\[YOUTUBE_SEARCH:.*?\]/, `\n\n**Recommended video:** Search YouTube for "${query}"\n\nOr I can explain it here with diagrams. What would you prefer?`);
  }

  res.status(200).json({ reply });
}
