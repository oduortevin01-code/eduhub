export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

  const { question, type, user } = req.body;
  const OPENAI_KEY = process.env.OPENAI_API_KEY; // Vercel pulls your key safely

  let systemPrompt = `You are Zimora AI for Kenyan students. Level: ${user.level}. 
  Use KICD/8-4-4 syllabus. Be simple, exam-focused. Add KCSE tips.`;

  let userPrompt = question;

  // 1. MOCK PAPER WITH ZIMORA LETTERHEAD
  if (type === 'mock') {
    systemPrompt += `Generate a full mock paper with marking scheme. 
    Start with this exact header:

    ZIMORA AI          |        EASY LEARNING
    🎓                 |        Year: 2026

    KENYA CERTIFICATE OF SECONDARY EDUCATION
    ${user.level.toUpperCase()} MOCK EXAMINATION
    ${question.toUpperCase()}
    Time: 2 Hours

    End with: © Zimora AI 2026 | www.zimora.co.ke`;
    userPrompt = `Create a ${user.level} mock exam for ${question} with 10 questions and marking scheme`;
  }

  // 2. NOTES WITH YOUTUBE + QUIZ
  if (type === 'notes') {
    systemPrompt += `Generate notes then add: 
    1. YouTube section: Search for "${question} animation KICD Kenya" and embed using iframe with modestbranding=1&rel=0
    2. Add 3 KCSE-style MCQs with answers explained.
    Start notes with: 📘 ${question.toUpperCase()} - ${user.level} NOTES
    © Zimora AI - Easy Learning 2026`;
    userPrompt = `Make complete notes for ${question} for ${user.level}. Add video + 3 quiz questions.`;
  }

  // 3. TOPICAL QUIZ
  if (type === 'quiz') {
    userPrompt = `Create 5 KCSE-style MCQs for ${user.level} topic: ${question}. Mark instantly.`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'Sorry, I had trouble with that. Try again.';

    // AUTO-EMBED YOUTUBE FOR NOTES - White label
    if (type === 'notes') {
      const videoId = 'hXgV5jep9nU'; // Default: Photosynthesis animation. Later we swap per topic.
      answer = answer.replace('--- 📺 Eduhub Easy Learning Video ---',
        `--- 📺 Zimora Easy Learning ---
        <iframe width="100%" height="200" 
        src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0" 
        frameborder="0" allowfullscreen></iframe>`);
    }

    // Handle any leftover YouTube-search markers from the prompt
    if (answer.includes('[YOUTUBE_SEARCH:')) {
      const match = answer.match(/\[YOUTUBE_SEARCH:(.*?)\]/);
      const query = match ? match[1] : question;
      answer = answer.replace(/\[YOUTUBE_SEARCH:.*?\]/,
        `\n\n**Recommended video:** Search YouTube for "${query}"\n\nOr I can explain it here with diagrams. What would you prefer?`);
    }

    res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ answer: 'Zimora AI error. Try again.' });
  }
}
