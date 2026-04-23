// ================================================
// 북돋움 - Cloudflare Worker
// Gemini API 프록시 서버 (무료)
// ================================================

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const body = await request.json();

      // messages 배열에서 프롬프트 추출 (Claude 형식 → Gemini 형식 변환)
      const prompt = body.messages?.[0]?.content || '';

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: body.max_tokens || 1000,
          }
        }),
      });

      const geminiData = await response.json();

      // Gemini 응답 → Claude 응답 형식으로 변환 (기존 HTML 코드 호환)
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const converted = {
        content: [{ type: 'text', text }]
      };

      return new Response(JSON.stringify(converted), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};
