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
            <div className="w-full h-[100dvh] flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-black leading-tight">
                    <span className="text-purple-700">Zydus</span> Industrial{" "}
                    <span className="text-green-900">Intelligence</span>
                </h1>
                <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-black/60">
                    AI-powered vacuum pump monitoring assistant
                </p>
                <div className="mt-6 sm:mt-8 w-full max-w-xl">
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
        <div className="w-full h-[100dvh] flex flex-col items-center justify-center py-3 sm:py-6">
            <div className="font-sans bg-white rounded-2xl sm:rounded-3xl shadow-md sm:shadow-lg w-full max-w-2xl mx-auto flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100dvh - 1.5rem)', height: '92dvh' }}>
                {/* Message list — grows to fill space, scrolls when full */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} role={msg.role} content={msg.content} />
                    ))}
                </div>

                {/* Input bar pinned to bottom */}
                <div className="px-3 sm:px-6 pb-3 sm:pb-6 pt-2">
                    <AIInputWithLoading
                        onSubmit={handleSubmit}
                        placeholder="Ask about vacuum pump performance..."
                    />
                </div>
            </div>
        </div>
    );
}
