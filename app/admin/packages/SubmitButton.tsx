"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="sticky bottom-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-base font-black text-slate-950 shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {pending && <Loader2 className="h-5 w-5 animate-spin" />}
            {pending ? "Saving packages..." : "Save All Packages"}
        </button>
    );
}