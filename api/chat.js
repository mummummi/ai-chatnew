export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, persona, interactionId } = req.body;
    // Vercel 환경변수에서 API 키를 가져옵니다 (GitHub에는 안 올라갑니다!)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API 키가 설정되지 않았습니다. Vercel 설정을 확인해주세요.' });
    }

    const systemPrompt = `당신은 '${persona.name}'입니다. 구체적인 상황/설명은 [${persona.context}]입니다.
대화 상대는 초등학교 ${persona.grade}학년 학생이며, 이 대화는 '${persona.subject}' 교과와 관련된 학습 활동입니다.
원칙: 
1. ${persona.name}에 완벽히 몰입하여 초등학생 눈높이에 맞는 다정한 말투 사용.
2. 부적절한 질문 시 부드럽게 타이르기. 
3. 학생 대답이 틀렸을 때 직접 지적하지 말고 비계(Scaffolding) 질문 던지기.`;

    try {
        const payload = {
            model: "models/gemini-3-flash-preview",
            input: { role: "user", parts: [{ text: message }] },
            instructions: { parts: [{ text: systemPrompt }] }
        };

        if (interactionId) {
            payload.previous_interaction_id = interactionId;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            throw new Error(data.error?.message || response.statusText);
        }

        const reply = data.candidates[0].content.parts[0].text;
        const newInteractionId = data.interaction_id;

        res.status(200).json({ reply: reply, interactionId: newInteractionId });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
}
