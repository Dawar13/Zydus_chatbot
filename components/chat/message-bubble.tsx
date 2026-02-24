"use client";

import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === "user";

    return (
        <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`
          max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm sm:text-base
          ${isUser
                        ? "ml-auto bg-black text-white"
                        : "mr-auto bg-black/5 text-black"}
        `}
            >
                {isUser ? (
                    content
                ) : (
                    <div className="prose prose-sm sm:prose-base prose-neutral max-w-none [&>h3]:text-sm [&>h3]:sm:text-base [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>ul]:mt-1 [&>ul]:mb-1 [&>p]:mt-1 [&>p]:mb-1">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
