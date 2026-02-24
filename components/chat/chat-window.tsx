"use client";

import { useState, useRef, useEffect } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { MessageBubble } from "./message-bubble";
import { QuickOptions } from "./quick-options";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const PRIMARY_OPTIONS = [
    "Current vacuum value achieved",
    "Setpoint vacuum value",
    "Power load",
    "Oil level condition",
    "Pump overheating",
    "Not achieving vacuum setpoint",
    "Pump not running",
    "Increased power consumption"
];

const SUB_OPTIONS: Record<string, { prompt: string, options: string[], formatText: (val: string) => string }> = {
    "Power load": {
        prompt: "Please select current condition:",
        options: ["Normal", "Increased", "Fluctuating", "Excessive"],
        formatText: (val) => `Power load is ${val}`
    },
    "Oil level condition": {
        prompt: "Please select current condition:",
        options: ["Normal", "Low", "Contaminated"],
        formatText: (val) => `Oil level condition is ${val}`
    },
    "Current vacuum value achieved": {
        prompt: "Please select current condition:",
        options: ["Normal", "Low", "Fluctuating"],
        formatText: (val) => `Current vacuum value achieved is ${val}`
    },
    "Pump overheating": {
        prompt: "Would you like to inspect mechanical or electrical causes?",
        options: ["Mechanical", "Electrical", "Both"],
        formatText: (val) => `Pump overheating due to ${val} causes`
    }
};

export function ChatWindow() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasStarted, setHasStarted] = useState(false);
    const [showOptions, setShowOptions] = useState(true);
    const [activeSubOption, setActiveSubOption] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, showOptions]);

    // Automatically start the chat on mount to show options on first visit
    useEffect(() => {
        handleInitialLoad();
    }, []);

    const callApi = async (value: string, currentHistory: Message[]) => {
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: value,
                    history: currentHistory,
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

    const handleInitialLoad = () => {
        setHasStarted(true);
        setMessages([
            {
                role: "assistant",
                content: "Welcome to the Vacuum Pump Diagnostic Assistant.\nPlease select a parameter to evaluate or type your issue directly."
            }
        ]);
        setShowOptions(true);
        setActiveSubOption(null);
    };

    const handleSubmit = async (value: string) => {
        if (!hasStarted) {
            setHasStarted(true);
        }

        const lowerVal = value.trim().toLowerCase();

        // Reset options if user types freely
        setShowOptions(false);
        setActiveSubOption(null);

        const userMessage: Message = { role: "user", content: value };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        if (lowerVal === "hi" || lowerVal === "hello" || messages.length === 0) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Welcome to the Vacuum Pump Diagnostic Assistant.\nPlease select a parameter to evaluate or type your issue directly."
                }
            ]);
            setShowOptions(true);
            return; // Do NOT call API
        }

        await callApi(value, messages);
    };

    const handleOptionSelect = async (option: string) => {
        if (activeSubOption === null) {
            // Processing primary option
            const userMsg: Message = { role: "user", content: option };
            const subOptConfig = SUB_OPTIONS[option];

            if (subOptConfig) {
                // Show sub options
                setMessages((prev) => [
                    ...prev,
                    userMsg,
                    { role: "assistant", content: subOptConfig.prompt }
                ]);
                setActiveSubOption(option);
            } else {
                // No sub options, call API
                setMessages((prev) => [...prev, userMsg]);
                setShowOptions(false);
                await callApi(option, messages);
            }
        } else {
            // Processing sub option
            const config = SUB_OPTIONS[activeSubOption];
            const formattedText = config.formatText(option);

            const userMsg: Message = { role: "user", content: formattedText };
            setMessages((prev) => [...prev, userMsg]);
            setShowOptions(false);
            setActiveSubOption(null);
            await callApi(formattedText, messages);
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

    const currentOptions = activeSubOption ? SUB_OPTIONS[activeSubOption].options : PRIMARY_OPTIONS;

    // ── Stage 2: Chat ──────────────────────────────────────────────
    return (
        <div className="w-full h-[100dvh] flex flex-col items-center justify-center py-3 sm:py-6">
            <div className="font-sans bg-white rounded-2xl sm:rounded-3xl shadow-md sm:shadow-lg w-full max-w-2xl mx-auto flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100dvh - 1.5rem)', height: '92dvh' }}>
                {/* Message list — grows to fill space, scrolls when full */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
                    {messages.map((msg, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <MessageBubble role={msg.role} content={msg.content} />
                        </div>
                    ))}
                    {showOptions && (
                        <div className="flex justify-start">
                            <QuickOptions options={currentOptions} onSelect={handleOptionSelect} />
                        </div>
                    )}
                    <div ref={bottomRef} />
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
