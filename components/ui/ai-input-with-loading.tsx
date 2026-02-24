"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface AIInputWithLoadingProps {
    onSubmit: (value: string) => Promise<void>;
    placeholder?: string;
}

export function AIInputWithLoading({
    onSubmit,
    placeholder = "Type a message...",
}: AIInputWithLoadingProps) {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 56,
        maxHeight: 200,
    });

    const handleSubmit = useCallback(async () => {
        const trimmed = value.trim();
        if (!trimmed || isLoading) return;

        setValue("");
        adjustHeight(true);
        setIsLoading(true);

        try {
            await onSubmit(trimmed);
        } finally {
            setIsLoading(false);
        }
    }, [value, isLoading, onSubmit, adjustHeight]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit]
    );

    return (
        <div className="w-full relative rounded-2xl border border-black/10 bg-white shadow-sm">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                className={[
                    "w-full resize-none bg-transparent px-4 py-4 pr-14 text-sm font-sans text-black",
                    "placeholder:text-black/40 outline-none rounded-2xl",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "transition-all duration-200",
                ].join(" ")}
                style={{ minHeight: 56 }}
            />

            <button
                onClick={handleSubmit}
                disabled={!value.trim() || isLoading}
                className={[
                    "absolute right-3 bottom-3 flex items-center justify-center",
                    "w-8 h-8 rounded-full transition-all duration-200",
                    value.trim() && !isLoading
                        ? "bg-black text-white hover:bg-black/80 scale-100"
                        : "bg-black/10 text-black/30 cursor-not-allowed scale-95",
                ].join(" ")}
                aria-label="Send message"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <ArrowUp className="w-4 h-4" />
                )}
            </button>
        </div>
    );
}
