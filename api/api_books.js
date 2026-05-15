export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ error: '검색어 없음', items: [] });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API 키 없음', items: [] });
  }

  try {
    const url = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(q)}&display=10&sort=sim`;
    const naverRes = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    const data = await naverRes.json();

    if (!naverRes.ok) {
      return res.status(500).json({ error: data.errorMessage || 'Naver 오류', items: [] });
    }

    // 필요한 정보만 추려서 반환
    const items = (data.items || []).map(item => ({
      title: item.title.replace(/<[^>]+>/g, ''),
      author: item.author.replace(/<[^>]+>/g, ''),
      publisher: item.publisher,
      pubdate: item.pubdate,
      image: item.image,
      description: item.description.replace(/<[^>]+>/g, '').slice(0, 300),
      isbn: item.isbn,
    }));

    return res.status(200).json({ items });

  } catch (e) {
    console.error('도서 검색 오류:', e.message);
    return res.status(500).json({ error: e.message, items: [] });
  }
}
