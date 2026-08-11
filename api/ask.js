export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

  const { prompt, history, eduName, eduLevel } = req.body;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  if (!prompt) {
    return res.status(400).json({ reply: 'Please type a question first.' });
  }

  const systemPrompt = `You are Zimora AI, a friendly tutor for Kenyan students.
Student: ${eduName || 'Student'}. Level: ${eduLevel || 'Secondary'}.
Follow the KICD/8-4-4 syllabus. Be simple, exam-focused, and encouraging. Add KCSE tips where relevant.

Formatting rules:
- Write math using LaTeX: $inline$ for inline, $$block$$ for display equations.
- When a diagram would help (a cycle, a labeled structure, a process), draw it as a mermaid code block, like:
  \`\`\`mermaid
  graph TD; A-->B;
  \`\`\`
- When a short explainer video would genuinely help, add exactly one line: [YOUTUBE_SEARCH:short search query]. Never invent a video title or link yourself.
- Use headings and bullet points for notes so they're easy to revise from.`;

  const messages = [{ role: 'system', content: systemPrompt }];
  if (history) {
    messages.push({ role: 'system', content: `Recent conversation so far, for context:\n${history}` });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(500).json({ reply: 'Zimora AI is having trouble reaching the tutor right now. Please try again shortly.' });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I had trouble with that. Try asking again.';
    res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: 'Zimora AI error. Try again.' });
  }
}
