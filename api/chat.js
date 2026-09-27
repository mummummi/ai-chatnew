export default async function handler(req, res) {
  // Vercel 환경에서 발생할 수 있는 CORS 오류를 방지하기 위한 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS(사전 요청)은 바로 성공 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  // Vercel 대시보드(Settings > Environment Variables)에서 등록한 GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: '서버 환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다. Vercel 설정을 확인해주세요.' 
    });
  }

  try {
    // 안정적이고 빠른 gemini-1.5-flash 모델 사용 (또는 gemini-2.0-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 프론트엔드에서 보낸 body(대화 기록, 프롬프트 등)를 그대로 전달
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    // 구글 API에서 에러를 반환했을 경우
    if (!response.ok) {
      const errorMessage = data.error?.message || 'Gemini API 호출 중 알 수 없는 에러가 발생했습니다.';
      return res.status(response.status).json({ error: errorMessage });
    }

    // 성공적으로 텍스트를 생성한 경우
    return res.status(200).json(data);
    
  } catch (error) {
    // 서버 통신 장애 등 예외 처리
    console.error('API 호출 실패:', error);
    return res.status(500).json({ error: error.message || '서버와의 통신에 실패했습니다.' });
  }
}
