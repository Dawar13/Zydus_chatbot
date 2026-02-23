"use client";

import { useState } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { MessageBubble } from "./message-bubble";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function ChatWindow() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasStarted, setHasStarted] = useState(false);

    const handleSubmit = async (value: string) => {
        if (!hasStarted) {
            setHasStarted(true);
        }

        // Add user message to state
        const userMessage: Message = { role: "user", content: value };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: value,
                    history: messages,
                }),
            });

            if (!response.ok) {
                throw new Error(`API response not OK: ${response.status}`);
            }

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply },
            ]);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            console.error("Chat Error:", msg);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "The AI diagnostic engine is temporarily unavailable. Please retry.",
                },
            ]);
        }
    };

    // ── Stage 1: Hero ──────────────────────────────────────────────
    if (!hasStarted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-5xl md:text-6xl font-normal tracking-tight text-black leading-tight">
                    Zydus Industrial Intelligence
                </h1>
                <p className="mt-4 text-lg text-black/60">
                    AI-powered vacuum pump monitoring assistant
                </p>
                <div className="mt-8 w-full max-w-xl">
                    <AIInputWithLoading
                        onSubmit={handleSubmit}
                        placeholder="Describe the vacuum pump issue..."
                    />
                </div>
            </div>
        );
    }

    // ── Stage 2: Chat ──────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-start justify-center px-4 py-6">
            <div
                className="font-sans bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-6"
                style={{ width: '40vw', maxWidth: '40vw', minHeight: 'calc(100vh - 6rem)' }}
            >
                {/* Message list — grows to fill space, scrolls when full */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} role={msg.role} content={msg.content} />
                    ))}
                </div>

                {/* Input bar pinned to bottom of the white box */}
                <AIInputWithLoading
                    onSubmit={handleSubmit}
                    placeholder="Ask about vacuum pump performance..."
                />
            </div>
        </div>
    );
}
