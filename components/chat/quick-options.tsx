import React from "react";

interface QuickOptionsProps {
    options: string[];
    onSelect: (option: string) => void;
}

export function QuickOptions({ options, onSelect }: QuickOptionsProps) {
    if (!options || options.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className="px-4 py-2 rounded-full border text-sm hover:bg-black hover:text-white transition whitespace-normal text-left"
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
