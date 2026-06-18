"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export default function LoginSubmitButton() {
    const { pending } = useFormStatus();
    const [clicked, setClicked] = useState(false);
    const clickedRef = useRef(false);

    const loading = clicked || pending;

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
        if (clickedRef.current) {
            e.preventDefault();
            return;
        }

        clickedRef.current = true;
        setClicked(true);
    }

    return (
        <button
            type="submit"
            aria-disabled={loading}
            onClick={handleClick}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-950 transition ${loading
                ? "cursor-not-allowed bg-emerald-400 opacity-70"
                : "cursor-pointer bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98]"
                }`}
        >
            {loading && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            )}

            {loading ? "Connecting..." : "Login to Internet"}
        </button>
    );
}