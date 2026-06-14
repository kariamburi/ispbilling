"use client";

import { useFormStatus } from "react-dom";

export default function SaveButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-2xl cursor-pointer bg-emerald-500 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {pending ? (
                <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Saving...
                </span>
            ) : (
                "Save Router"
            )}
        </button>
    );
}