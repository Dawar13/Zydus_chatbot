import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { retrieve } from "@/lib/rag";

// Force Node.js runtime — prevents Edge runtime issues with SDKs
export const runtime = "nodejs";

const FALLBACK = "The AI diagnostic engine is temporarily unavailable. Please retry.";

const systemPrompt = `
You are the Zydus Industrial Intelligence Assistant.

You are an AI system designed specifically to support engineers at Zydus Life Sciences in monitoring and troubleshooting industrial vacuum pumps used in pharmaceutical manufacturing environments.

Your responsibilities:

1. Provide clear, structured, and technically accurate responses.
2. Focus on vacuum pump performance monitoring, fault diagnosis, and maintenance guidance.
3. Use professional engineering language suitable for plant engineers.
4. Prioritize safety, compliance, and operational reliability.
5. Avoid speculation. If insufficient data is provided, ask for relevant parameters.

Relevant Monitoring Parameters:
- Current vacuum value achieved
- Setpoint vacuum value
- Power load
- Running hours
- Time taken to reach setpoint
- Oil level condition

Common Vacuum Pump Issues:
- Not achieving vacuum set point
- Pump overheating or overload
- Pump not running
- Excessive power consumption
- Oil contamination or low oil level

When diagnosing:
- Suggest possible root causes
- Suggest inspection steps
- Suggest corrective actions
- Keep answers structured using bullet points when appropriate
- Avoid unnecessary verbosity

Do NOT provide medical advice.
Do NOT answer unrelated general knowledge questions.
If the question is outside vacuum pump monitoring or industrial equipment, respond that the system is restricted to industrial vacuum pump diagnostics.

Maintain a professional and concise tone at all times.

Format responses using proper Markdown with headings and bullet lists.

Respond using structured Markdown. Use the following structure when applicable:

### Possible Causes
- Cause 1
- Cause 2

### Recommended Inspection Steps
- Step 1
- Step 2

### Corrective Actions
- Action 1
- Action 2

Do not use asterisk-based bullet formatting. Use dashes (-) for bullets.
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = body?.message;
        const history = body?.history;

        console.log("── /api/chat hit ──");
        console.log("Incoming message:", message);

        if (!message) {
            console.warn("No message in request body");
            return NextResponse.json({ reply: FALLBACK });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error("GROQ_API_KEY is not defined in environment variables");
            return NextResponse.json({ reply: FALLBACK });
        }

        // Retrieve relevant knowledge using RAG
        let ragContext = "";
        try {
            const retrievedContext = retrieve(message, 2);
            if (retrievedContext.length > 0) {
                ragContext = `\n\nRelevant Knowledge from Database:\n${retrievedContext.join("\n\n")}`;
            }
        } catch (ragError) {
            console.warn("RAG retrieval failed, proceeding without context:", ragError);
        }

        // Build messages array for Groq (OpenAI-compatible format)
        const chatMessages: Groq.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt + ragContext },
        ];

        // Add conversation history
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                chatMessages.push({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content,
                });
            }
        }

        // Add current user message
        chatMessages.push({ role: "user", content: message });

        const groq = new Groq({ apiKey });

        // 10-second timeout safeguard
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Groq request timed out after 10s")), 10_000)
        );

        const groqPromise = groq.chat.completions.create({
            messages: chatMessages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 600,
            top_p: 0.9,
        });

        const chatCompletion = await Promise.race([groqPromise, timeoutPromise]);

        const reply = chatCompletion.choices[0]?.message?.content || "No response generated.";
        console.log("Groq response received, length:", reply.length);

        return NextResponse.json({ reply });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("Groq API Error:", errMsg);

        // Always return 200 with reply so frontend never sees a fetch failure
        return NextResponse.json({ reply: FALLBACK });
    }
}
