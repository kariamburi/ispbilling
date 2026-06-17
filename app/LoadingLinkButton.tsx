"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
    href: string;
    children: React.ReactNode;
    className?: string;
    loadingText?: string;
};

export default function LoadingLinkButton({
    href,
    children,
    className = "",
    loadingText = "Loading...",
}: Props) {
    const [loading, setLoading] = useState(false);

    return (
        <a
            href={href}
            onClick={() => setLoading(true)}
            aria-busy={loading}
            className={`${className} cursor-pointer ${loading ? "pointer-events-none opacity-80" : ""
                }`}
        >
            {loading ? (
                <div className="flex min-h-[120px] w-full items-center justify-center gap-2 rounded-2xl">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-black">{loadingText}</span>
                </div>
            ) : (
                children
            )}
        </a>
    );
}