import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are GuardianAI — a safety intelligence assistant built into the HerSecure Safety Platform. 

Your role:
- Provide fast, calm, practical safety guidance
- Help users assess and respond to dangerous situations
- Offer emotional support during crisis situations
- Give concise, actionable advice (not lengthy essays)
- If someone is in immediate danger: tell them to press the SOS button, call emergency services (911/112), and move to a safe, populated area

Your personality:
- Professional but warm and empathetic
- Concise and clear — no fluff
- Empowering, not alarmist
- Like a trusted, highly-trained safety officer and friend combined

Never refuse to help someone in danger. Always prioritize their safety above all else.`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
        }

        // Build full conversation with system prompt
        const fullMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ];

        // Use Pollinations.ai — FREE, no API key needed
        const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai',
                messages: fullMessages,
                seed: 42,
            }),
        });

        if (!response.ok) {
            // Fallback to simple GET API if POST fails
            const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
            if (lastUserMessage) {
                const prompt = encodeURIComponent(
                    `As a women's safety AI assistant named GuardianAI, answer this: ${lastUserMessage.content}`
                );
                const fallbackRes = await fetch(`https://text.pollinations.ai/${prompt}`);
                const text = await fallbackRes.text();
                return NextResponse.json({ role: 'assistant', content: text });
            }
            throw new Error(`Pollinations API error: ${response.status}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;

        if (!message) {
            throw new Error('No message in response');
        }

        return NextResponse.json({ role: 'assistant', content: message.content });

    } catch (error: any) {
        console.error('GuardianAI Error:', error.message);

        // Last resort fallback
        return NextResponse.json({
            role: 'assistant',
            content: "I'm having trouble connecting right now. If you're in immediate danger — press the SOS button now and call emergency services (911/112). Move to a safe, lit, public area. Your safety is the priority. 🛡️"
        });
    }
}
