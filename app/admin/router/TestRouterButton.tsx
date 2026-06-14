"use client";

import { useState } from "react";

export default function TestRouterButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");

    async function testConnection() {
        try {
            setLoading(true);
            setResult("");

            const res = await fetch("/api/router/test", {
                cache: "no-store",
            });

            const data = await res.json();

            if (data.ok) {
                setResult("✅ MikroTik connected successfully");
            } else {
                setResult(`❌ ${data.error || "Connection failed"}`);
            }
        } catch (error: any) {
            setResult(`❌ ${error?.message || "Connection failed"}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={testConnection}
                disabled={loading}
                className="rounded-2xl cursor-pointer bg-slate-950 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? "Testing..." : "Test Connection"}
            </button>

            {result && <p className="mt-3 text-sm font-bold">{result}</p>}
        </div>
    );
}