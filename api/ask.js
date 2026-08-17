export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

  const { prompt, history, eduName, eduLevel, eduCountry, eduCurriculum, notes, image } = req.body;
  const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

  if (!prompt) {
    return res.status(400).json({ reply: 'Please type a question first.' });
  }

  const locationLine = (eduCountry || eduCurriculum)
    ? `Student's country: ${eduCountry || 'not specified'}. Curriculum/exam board: ${eduCurriculum || 'not specified'}.`
    : `The student hasn't told you their country or curriculum yet.`;

  const systemPrompt = `You are Zimora AI, a friendly, patient tutor for students anywhere in the world — not just one country.
Student: ${eduName || 'Student'}. Level: ${eduLevel || 'not specified'}.
${locationLine}

Curriculum rules:
- If you don't yet know the student's country/curriculum and it matters for the answer (exam names, syllabus structure, terminology), ask them briefly before assuming one system.
- Once you know their curriculum, tailor explanations, terminology, and exam tips to it specifically.
- For subjects that aren't curriculum-specific, just teach well without needing to ask.
- Be simple, exam-focused, and encouraging.

Formatting rules:
- Write math using LaTeX: $inline$ for inline, $$block$$ for display equations.
- When a diagram would help, draw it as a mermaid code block, like:
  \`\`\`mermaid
  graph TD; A-->B;
  \`\`\`
- When a short explainer video would genuinely help, add exactly one line: [YOUTUBE_SEARCH:short search query]. Never invent a video title or link yourself.
- Use headings and bullet points for notes so they're easy to revise from.`;

  const messages = [{ role: 'system', content: systemPrompt }];

  if (notes && notes.trim()) {
    messages.push({
      role: 'system',
      content: `The student has uploaded their own study notes below. Teach and quiz them using THIS material as the primary source.\n\n--- STUDENT'S NOTES ---\n${notes}\n--- END OF NOTES ---`
    });
  }

  if (history) {
    messages.push({ role: 'system', content: `Recent conversation so far, for context:\n${history}` });
  }

  if (image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: image } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const model = image ? 'meta/llama-3.2-90b-vision-instruct' : 'meta/llama-3.3-70b-instruct';

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('NVIDIA NIM API error:', data);
      const friendlyMsg = image
        ? 'Zimora AI had trouble reading that photo — try a clearer, well-lit shot, or a smaller image.'
        : 'Zimora AI is having trouble reaching the tutor right now. Please try again shortly.';
      return res.status(500).json({ reply: friendlyMsg });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I had trouble with that. Try asking again.';
    res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: 'Zimora AI error. Try again.' });
  }
}
