export default async function handler(req, res) {
    // 보안을 위해 POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, persona, history } = req.body;
    
    // Vercel 환경변수에서 API 키를 가져옵니다. (GitHub에 노출되지 않음!)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API 키가 Vercel에 설정되지 않았습니다.' });
    }

    // 시스템 프롬프트: 학생이 설정한 페르소나 정보를 완벽하게 반영하여 지시
    const systemPrompt = `당신은 '${persona.name}'입니다. 
당신이 처한 구체적인 상황이나 설명은 다음과 같습니다: [${persona.context}].
대화하는 상대는 '초등학교 ${persona.grade}학년' 학생이며, 관련된 교과는 '${persona.subject}'입니다.

엄격한 원칙:
1. [완벽한 몰입] 설정된 대상(${persona.name})과 상황에 완벽히 빙의하세요. AI라고 밝히지 마세요.
2. [눈높이 맞춤] 초등학교 ${persona.grade}학년 수준에 맞는 쉬운 어휘를 사용하고, 친절한 말투를 유지하세요.
3. [과목 연계] '${persona.subject}' 교과의 가치(도덕적 성찰, 국어적 표현 등)가 자연스럽게 녹아들게 하세요.
4. [인성 교육] 학생이 부적절한 말을 하면 절대 화내지 말고, ${persona.name}의 성품에 맞게 타이르세요.
5. [비계 설정] 대답이 틀렸다면 직접 지적하지 말고 스스로 올바른 생각을 유도하는 '힌트 질문'을 던지세요.`;

    try {
        // 최신 구글 제미나이 모델 호출 (공식 규격인 system_instruction 사용)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: systemPrompt }] 
                },
                contents: [
                    ...(history || []), // 이전 대화 기록이 있다면 포함
                    { role: 'user', parts: [{ text: message }] } // 새로운 메시지
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Gemini API 오류');
        }

        const reply = data.candidates[0].content.parts[0].text;
        
        // 정상적으로 프론트엔드로 답변 전달
        res.status(200).json({ reply: reply });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
}
