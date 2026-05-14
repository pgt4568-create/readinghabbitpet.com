export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키 없음', content: [{ type: 'text', text: '' }] });

  const { messages, max_tokens } = req.body;
  if (!messages?.length) return res.status(400).json({ error: '메시지 없음', content: [{ type: 'text', text: '' }] });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: '당신은 한국어로만 답변하는 AI입니다. 영어, 한자, 일본어 등 다른 언어를 절대 사용하지 마세요. 모든 응답은 반드시 한국어로만 작성하세요.'
          },
          ...messages
        ],
        max_tokens: Math.min(max_tokens || 2000, 8192),
        temperature: 0.7,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('Groq 오류:', data);
      return res.status(500).json({ error: JSON.stringify(data), content: [{ type: 'text', text: '' }] });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }], model: 'llama-3.3-70b-versatile' });

  } catch (e) {
    console.error('예외:', e.message);
    return res.status(500).json({ error: e.message, content: [{ type: 'text', text: '' }] });
  }
}
