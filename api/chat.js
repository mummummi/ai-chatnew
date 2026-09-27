export default async function handler(req, res) {
  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel 대시보드에서 등록한 GEMINI_API_KEY 환경변수 불러오기
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY가 Vercel 환경 변수에 설정되지 않았습니다.' 
    });
  }

  try {
    // Google Gemini 2.5 Flash API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || '서버 통신 실패' });
  }
}
