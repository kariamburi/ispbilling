import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PaymentStatusPage({ params }: Props) {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
        where: { id },
    });

    if (!payment) notFound();

    const session =
        payment.customerId && payment.packageId
            ? await prisma.internetSession.findFirst({
                where: {
                    customerId: payment.customerId,
                    packageId: payment.packageId,
                    active: true,
                },
                orderBy: { createdAt: "desc" },
            })
            : null;

    const settings = await prisma.appSetting.findUnique({
        where: { id: "main" },
    });

    const portalName = settings?.portalName || "CRAFT WIFI";

    const isPaid = payment.status === "PAID";
    const isFailed = payment.status === "FAILED";
    const canAutoLogin = isPaid && session?.activationStatus === "ACTIVATED";

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            {!isPaid && !isFailed && <meta httpEquiv="refresh" content="5" />}

            {isPaid && !canAutoLogin && !isFailed && (
                <meta httpEquiv="refresh" content="3" />
            )}

            {canAutoLogin && (
                <meta
                    httpEquiv="refresh"
                    content={`2;url=/auto-login?sessionId=${session.id}`}
                />
            )}

            <div className="mx-auto max-w-md">
                <div className="rounded-3xl bg-white p-6 text-center text-slate-950">
                    <h1 className="text-2xl font-black">{portalName}</h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {canAutoLogin
                            ? "Connecting you to internet..."
                            : isPaid
                                ? "Payment received, activating internet..."
                                : isFailed
                                    ? "Payment failed"
                                    : "Waiting for M-Pesa payment"}
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-100 p-4">
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-bold">{payment.phone}</p>

                        <p className="mt-3 text-sm text-slate-500">Amount</p>
                        <p className="text-3xl font-black">KES {payment.amount}</p>

                        <p className="mt-3 text-sm text-slate-500">Status</p>
                        <p className="font-black">{payment.status}</p>

                        {payment.mpesaCode && (
                            <>
                                <p className="mt-3 text-sm text-slate-500">M-Pesa Code</p>
                                <p className="font-bold">{payment.mpesaCode}</p>
                            </>
                        )}
                    </div>

                    {isPaid && session && (
                        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-left">
                            <p className="text-sm font-bold text-emerald-700">
                                Internet Login Details
                            </p>

                            <p className="mt-3 text-sm text-slate-500">Username</p>
                            <p className="text-xl font-black">{session.username}</p>

                            <p className="mt-3 text-sm text-slate-500">Password</p>
                            <p className="text-xl font-black">{session.password}</p>

                            <p className="mt-3 text-sm text-slate-500">Expires</p>
                            <p className="font-bold">
                                {new Date(session.expiresAt).toLocaleString()}
                            </p>

                            <p className="mt-3 text-sm text-slate-500">Activation</p>
                            <p className="font-bold">{session.activationStatus}</p>

                            {session.activationError && (
                                <p className="mt-3 text-xs font-bold text-red-600">
                                    {session.activationError}
                                </p>
                            )}
                        </div>
                    )}

                    <p className="mt-5 text-sm text-slate-500">
                        {canAutoLogin
                            ? "Please wait. You will be connected automatically."
                            : isPaid
                                ? "Payment received. We are activating your internet access."
                                : isFailed
                                    ? "Payment was not completed. Please try again."
                                    : "Check your phone and enter M-Pesa PIN. This page refreshes automatically."}
                    </p>

                    {canAutoLogin ? (
                        <a
                            href={`/auto-login?sessionId=${session.id}`}
                            className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950"
                        >
                            Connect Now
                        </a>
                    ) : (
                        <a
                            href="/"
                            className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950"
                        >
                            {isPaid ? "Buy More Time" : "Back to packages"}
                        </a>
                    )}
                </div>
            </div>
        </main>
    );
}