"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function SubmitSettingsButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {pending && <Loader2 className="h-5 w-5 animate-spin" />}
            {pending ? "Saving settings..." : "Save Settings"}
        </button>
    );
}