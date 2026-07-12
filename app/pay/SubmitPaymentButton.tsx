"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    packageId: string;
    mac?: string;
    isFreeTrial: boolean;
};

type PaymentStage =
    | "IDLE"
    | "SENDING"
    | "WAITING"
    | "PAID"
    | "FAILED"
    | "ERROR";

export default function SubmitPaymentButton({
    packageId,
    mac = "",
    isFreeTrial,
}: Props) {
    const router = useRouter();

    const [stage, setStage] = useState<PaymentStage>("IDLE");
    const [message, setMessage] = useState("");
    const [paymentId, setPaymentId] = useState<string | null>(null);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submittedRef = useRef(false);

    const loading = stage === "SENDING" || stage === "WAITING";

    function stopPolling() {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }

    useEffect(() => {
        return () => stopPolling();
    }, []);

    async function checkPaymentStatus(id: string) {
        try {
            const response = await fetch(`/api/payments/${id}/status`, {
                method: "GET",
                cache: "no-store",
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                return;
            }

            if (result.status === "PAID") {
                stopPolling();

                setStage("PAID");
                setMessage("Payment received. Activating your internet...");

                router.replace(`/payment/${id}`);
                router.refresh();
                return;
            }

            if (result.status === "FAILED") {
                stopPolling();

                submittedRef.current = false;
                setStage("FAILED");
                setMessage(
                    result.message ||
                    "Payment was not completed. Please try again."
                );
            }
        } catch (error) {
            console.error("Payment status check failed:", error);
        }
    }

    function startPolling(id: string) {
        stopPolling();

        void checkPaymentStatus(id);

        pollingRef.current = setInterval(() => {
            void checkPaymentStatus(id);
        }, 3000);

        timeoutRef.current = setTimeout(() => {
            stopPolling();

            submittedRef.current = false;
            setStage("ERROR");
            setMessage(
                "Payment confirmation is taking longer than expected. Check your M-Pesa messages before trying again."
            );
        }, 3 * 60 * 1000);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submittedRef.current || loading) {
            return;
        }

        submittedRef.current = true;

        const form = event.currentTarget;
        const formData = new FormData(form);

        const phone = String(formData.get("phone") || "").trim();

        if (!phone) {
            submittedRef.current = false;
            setStage("ERROR");
            setMessage("Enter your phone number.");
            return;
        }

        setStage("SENDING");
        setMessage(
            isFreeTrial
                ? "Starting your free trial..."
                : "Sending M-Pesa request to your phone..."
        );

        try {
            const response = await fetch("/api/payments/initiate", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                submittedRef.current = false;
                setStage("ERROR");
                setMessage(
                    result.error ||
                    "Unable to start payment. Please try again."
                );
                return;
            }

            if (result.freeTrial) {
                router.replace(`/auto-login?sessionId=${result.sessionId}`);
                return;
            }

            if (!result.paymentId) {
                submittedRef.current = false;
                setStage("ERROR");
                setMessage("Payment was initiated without a payment ID.");
                return;
            }

            setPaymentId(result.paymentId);
            setStage("WAITING");
            setMessage(
                "STK push sent. Check your phone and enter your M-Pesa PIN."
            );

            startPolling(result.paymentId);
        } catch (error) {
            console.error("Payment initiation failed:", error);

            submittedRef.current = false;
            setStage("ERROR");
            setMessage(
                "Unable to send the M-Pesa request. Check your connection and try again."
            );
        }
    }

    function tryAgain() {
        stopPolling();

        submittedRef.current = false;
        setStage("IDLE");
        setMessage("");
        setPaymentId(null);
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <input type="hidden" name="packageId" value={packageId} />
                <input type="hidden" name="mac" value={mac} />

                <div>
                    <label htmlFor="phone" className="text-sm font-black">
                        {isFreeTrial
                            ? "Phone Number"
                            : "M-Pesa Phone Number"}
                    </label>

                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                        disabled={loading}
                        placeholder="07XXXXXXXX"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-950 transition ${loading
                        ? "cursor-not-allowed bg-emerald-400 opacity-70"
                        : "cursor-pointer bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98]"
                        }`}
                >
                    {loading && (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    )}

                    {stage === "SENDING" ? (
                        <div className="flex flex-col items-center">
                            <span>
                                {isFreeTrial
                                    ? "Starting trial..."
                                    : "Sending STK push..."}
                            </span>

                            <span className="text-[10px] font-bold opacity-70">
                                Please wait, do not press again
                            </span>
                        </div>
                    ) : stage === "WAITING" ? (
                        <div className="flex flex-col items-center">
                            <span>Waiting for M-Pesa payment...</span>

                            <span className="text-[10px] font-bold opacity-70">
                                Enter your PIN on your phone
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

                {message && stage !== "WAITING" && (
                    <div
                        className={`rounded-2xl border p-4 text-sm font-bold ${stage === "PAID"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : stage === "FAILED" || stage === "ERROR"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                    >
                        <p>{message}</p>

                        {(stage === "FAILED" || stage === "ERROR") && (
                            <div className="mt-3 flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={tryAgain}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white"
                                >
                                    Try Again
                                </button>

                                {paymentId && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/payment/${paymentId}`
                                            )
                                        }
                                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700"
                                    >
                                        Check Existing Payment
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </form>

            {stage === "WAITING" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-5">
                    <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center text-slate-950 shadow-2xl">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                            <span className="text-5xl">📱</span>
                        </div>

                        <h2 className="mt-5 text-2xl font-black">
                            Check your phone
                        </h2>

                        <p className="mt-2 text-sm font-bold text-slate-600">
                            An M-Pesa STK request has been sent to your phone.
                        </p>

                        <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                            <p className="font-black text-emerald-700">
                                Enter your M-Pesa PIN
                            </p>

                            <p className="mt-1 text-sm font-semibold text-emerald-700">
                                Keep this page open. Internet activation will
                                continue automatically after payment.
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-center gap-2">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />

                            <span className="text-sm font-black text-slate-700">
                                Waiting for payment confirmation...
                            </span>
                        </div>

                        <p className="mt-5 text-xs font-bold text-slate-500">
                            Do not go back or select another package.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}