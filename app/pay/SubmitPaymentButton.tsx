"use client";

import { useRef, useState } from "react";

type Props = {
    isFreeTrial: boolean;
};

export default function SubmitPaymentButton({ isFreeTrial }: Props) {
    const [loading, setLoading] = useState(false);
    const clickedRef = useRef(false);

    function handleClick() {
        if (clickedRef.current) return;

        clickedRef.current = true;
        setLoading(true);
    }

    return (
        <button
            type="submit"
            disabled={loading}
            onClick={handleClick}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {loading && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            )}

            {loading ? (
                <div className="flex flex-col items-center">
                    <span>
                        {isFreeTrial
                            ? "Starting trial..."
                            : "Processing payment..."}
                    </span>

                    <span className="text-[10px] font-bold opacity-70">
                        Please wait, do not press again
                    </span>
                </div>
            ) : (
                <span>
                    {isFreeTrial
                        ? "Start Free Trial"
                        : "Pay with M-Pesa"}
                </span>
            )}
        </button>
    );
}