export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      reply: 'Only POST requests are allowed.'
    });
  }

  try {
    const {
      prompt,
      history,
      eduName,
      eduLevel,
      eduCountry,
      eduCurriculum,
      notes,
      image,
      stream
    } = req.body || {};

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

    if (!NVIDIA_KEY) {
      console.error('NVIDIA_API_KEY is missing');

      return res.status(500).json({
        reply: 'Zimora AI is not configured correctly.'
      });
    }

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        reply: 'Please type a question first.'
      });
    }

    // FIX: This was missing in your original file.
    const locationLine = eduCountry
      ? `Country: ${eduCountry}. Curriculum: ${
          eduCurriculum || 'not specified'
        }.`
      : eduCurriculum
        ? `Curriculum: ${eduCurriculum}.`
        : '';

    const messages = [];

    // AI VISION — Scanner and image questions
    if (image) {
      const visionInstructions = `
You are Zimora AI, a friendly, patient educational tutor.

Student: ${eduName || 'Student'}
Education level: ${eduLevel || 'not specified'}

If asked who created you, say you were created by Gift Tevin Oduor as part of the Zimora learning platform.

Carefully examine the attached image. It may contain:
- A printed question
- Handwritten work
- Mathematics
- An equation
- A diagram
- A chart
- A graph
- Homework

Answer the student's request clearly.
Explain step by step where appropriate.

Student request:
${prompt}
      `.trim();

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: visionInstructions
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      });

    } else {
      // NORMAL TEXT AI
      const systemPrompt = `
You are Zimora AI, a friendly, patient and intelligent educational tutor for learners anywhere in the world.

Student: ${eduName || 'Student'}
Education level: ${eduLevel || 'not specified'}
${locationLine}

Identity:
If asked who created you, say naturally that you were created by Gift Tevin Oduor as part of the Zimora learning platform.

Teaching rules:
- Explain clearly and accurately.
- Adapt to the student's education level.
- Break difficult topics into simple steps.
- Give examples where useful.
- Be encouraging.
- Keep answers focused.
- Do not unnecessarily repeat yourself.
- If curriculum information is important but missing, ask briefly instead of assuming.

Formatting:
- Use headings and bullet points when useful.
- Use LaTeX for mathematics.
- Use $...$ for inline mathematics.
- Use $$...$$ for display mathematics.
- When a diagram is useful, you may use Mermaid.
- For study notes, make the information clear and revision-friendly.
      `.trim();

      messages.push({
        role: 'system',
        content: systemPrompt
      });

      if (notes && String(notes).trim()) {
        messages.push({
          role: 'system',
          content: `
The student has uploaded study material.

Use this material as the primary source when relevant:

--- STUDENT MATERIAL ---
${String(notes).slice(0, 16000)}
--- END STUDENT MATERIAL ---
          `.trim()
        });
      }

      if (history && String(history).trim()) {
        messages.push({
          role: 'system',
          content: `
Recent conversation context:

${String(history).slice(-12000)}
          `.trim()
        });
      }

      messages.push({
        role: 'user',
        content: String(prompt)
      });
    }

    const wantsStream = Boolean(stream) && !image;

    const model = image
      ? 'meta/llama-3.2-90b-vision-instruct'
      : 'meta/llama-3.3-70b-instruct';

    const upstream = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${NVIDIA_KEY}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1200,
          stream: wantsStream
        })
      }
    );

    // NVIDIA ERROR
    if (!upstream.ok) {
      const errorText = await upstream.text();

      console.error(
        'NVIDIA API error:',
        upstream.status,
        errorText
      );

      return res.status(500).json({
        reply: `Zimora AI is temporarily unavailable. Please try again.`
      });
    }

    // NORMAL NON-STREAMING RESPONSE
    if (!wantsStream) {
      const data = await upstream.json();

      const reply =
        data?.choices?.[0]?.message?.content ||
        'Sorry, I could not generate a response. Please try again.';

      return res.status(200).json({
        reply
      });
    }

    // STREAMING RESPONSE
    res.statusCode = 200;

    res.setHeader(
      'Content-Type',
      'text/event-stream; charset=utf-8'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache, no-transform'
    );

    res.setHeader(
      'Connection',
      'keep-alive'
    );

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const reader = upstream.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      res.write(Buffer.from(value));
    }

    return res.end();

  } catch (error) {
    console.error('Zimora API error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        reply:
          'Zimora AI encountered a server error. Please try again.'
      });
    }

    return res.end();
  }
        }
