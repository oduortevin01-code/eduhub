export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

  const { prompt, history, eduName, eduLevel, eduCountry, eduCurriculum, notes, image, stream } = req.body;
  const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

  if (!prompt) {
    return res.status(400).json({ reply: 'Please type a question first.' });
  }

  const messages = [];

  // NVIDIA's vision model (Llama 3.2 90B Vision) rejects requests that include
  // any system-role message when an image is attached, and supports only one
  // image per request. So for image requests, fold the instructions into the
  // user message's own text instead of using a system role at all.
  if (image) {
    const visionInstructions = `You are Zimora AI, a friendly tutor. Student: ${eduName || 'Student'}, level: ${eduLevel || 'not specified'}. If asked who created you, say you were created by Gift Tevin Oduor as part of the Zimora learning platform. Read the attached image carefully (it may be a handwritten or printed question, diagram, or homework) and respond to the student's request below, explaining clearly and step by step where relevant.`;
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: `${visionInstructions}\n\nStudent's request: ${prompt}` },
        { type: 'image_url', image_url: { url: image } }
      ]
    });
  } else {
    const systemPrompt = `You are Zimora AI, a friendly, patient tutor for students anywhere in the world — not just one country.
Student: ${eduName || 'Student'}. Level: ${eduLevel || 'not specified'}.
${locationLine}

Identity rule:
- If asked who created you, who made you, or who your creator is, answer naturally in your own words: you were created by Gift Tevin Oduor as part of the Zimora learning platform, and your purpose is to help learners understand, practise, revise, and learn more effectively. Don't repeat this fact unless asked.

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
- Use headings and bullet points for notes so they're easy to revise from.
- Keep responses focused — don't pad with repetition, since long unnecessary output is the main thing that makes replies feel slow.`;

    messages.push({ role: 'system', content: systemPrompt });

    if (notes && notes.trim()) {
      messages.push({
        role: 'system',
        content: `The student has uploaded their own study notes below. Teach and quiz them using THIS material as the primary source.\n\n--- STUDENT'S NOTES ---\n${notes}\n--- END OF NOTES ---`
      });
    }

    if (history) {
      messages.push({ role: 'system', content: `Recent conversation so far, for context:\n${history}` });
    }

    messages.push({ role: 'user', content: prompt });
  }

  // Images use the vision model, which NVIDIA doesn't support in streaming mode here —
  // so vision replies stay non-streamed; everything else streams.
  const wantsStream = !!stream && !image;
  const model = image ? 'meta/llama-3.2-90b-vision-instruct' : 'meta/llama-3.3-70b-instruct';

  try {
    const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1200,
        stream: wantsStream
      })
    });

    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({}));
      console.error('NVIDIA NIM API error:', errData);
      const friendlyMsg = image
        ? 'Zimora AI had trouble reading that photo — try a clearer, well-lit shot, or a smaller image.'
        : 'Zimora AI is having trouble reaching the tutor right now. Please try again shortly.';
      return res.status(500).json({ reply: friendlyMsg });
    }

    if (!wantsStream) {
      const data = await upstream.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I had trouble with that. Try asking again.';
      return res.status(200).json({ reply });
    }

    // Proxy the upstream SSE stream straight through to the browser.
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ reply: 'Zimora AI error. Try again.' });
    } else {
      res.end();
    }
  }
      }
      
