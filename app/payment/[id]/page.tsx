import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LoadingLinkButton from "../../LoadingLinkButton";

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
    const activationPending =
        isPaid && (!session || session.activationStatus === "PENDING");

    return (
        <main className="min-h-screen bg-[#061b13] text-white">
            {!isPaid && !isFailed && <meta httpEquiv="refresh" content="5" />}

            {activationPending && <meta httpEquiv="refresh" content="2" />}

            {canAutoLogin && (
                <meta
                    httpEquiv="refresh"
                    content={`2;url=/auto-login?sessionId=${session.id}`}
                />
            )}

            <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
                            Payment Status
                        </p>
                        <h1 className="mt-1 text-2xl font-black">{portalName}</h1>
                    </div>

                    <div className="rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-200">
                        Live
                    </div>
                </header>

                <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-6 text-slate-950 shadow-2xl">
                    <p className="text-sm font-black uppercase tracking-wide">
                        {canAutoLogin
                            ? "Ready to Connect"
                            : activationPending
                                ? "Activating Session"
                                : isPaid
                                    ? "Payment Received"
                                    : isFailed
                                        ? "Payment Failed"
                                        : "Awaiting Payment"}
                    </p>

                    <h2 className="mt-3 text-3xl font-black leading-tight">
                        {canAutoLogin
                            ? "Your internet is ready."
                            : activationPending
                                ? "Connecting to MikroTik..."
                                : isPaid
                                    ? "Preparing your internet."
                                    : isFailed
                                        ? "Payment was not completed."
                                        : "Complete M-Pesa payment."}
                    </h2>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                        {canAutoLogin
                            ? "You will be connected automatically shortly."
                            : activationPending
                                ? "Please wait while we create your internet access."
                                : isPaid
                                    ? "Please wait while we activate your session."
                                    : isFailed
                                        ? "You can go back and try again."
                                        : "Check your phone and enter your M-Pesa PIN."}
                    </p>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
                    <div className="flex items-center justify-center">
                        {activationPending ? (
                            <div className="relative flex h-24 w-24 items-center justify-center">
                                <span className="absolute h-24 w-24 animate-ping rounded-full bg-emerald-300 opacity-30" />
                                <span className="absolute h-16 w-16 animate-pulse rounded-full bg-emerald-100" />
                                <span className="relative text-4xl">📶</span>
                            </div>
                        ) : (
                            <div
                                className={`flex h-20 w-20 items-center justify-center rounded-full ${canAutoLogin || isPaid
                                    ? "bg-emerald-100 text-emerald-700"
                                    : isFailed
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                            >
                                <span className="text-3xl font-black">
                                    {canAutoLogin || isPaid ? "✓" : isFailed ? "!" : "..."}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500">Phone</p>
                                <p className="mt-1 font-black">{payment.phone}</p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500">Amount</p>
                                <p className="mt-1 text-xl font-black">KES {payment.amount}</p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-500">Payment</p>
                                <p
                                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${isPaid
                                        ? "bg-emerald-100 text-emerald-700"
                                        : isFailed
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                >
                                    {payment.status}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500">Activation</p>
                                <p
                                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${canAutoLogin
                                        ? "bg-emerald-100 text-emerald-700"
                                        : activationPending
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    {session?.activationStatus || "WAITING"}
                                </p>
                            </div>

                            {payment.mpesaCode && (
                                <div className="col-span-2">
                                    <p className="text-xs font-bold text-slate-500">M-Pesa Code</p>
                                    <p className="mt-1 font-black">{payment.mpesaCode}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {activationPending && (
                        <div className="mt-5 rounded-3xl bg-amber-50 p-4 text-center">
                            <p className="font-black text-amber-700">
                                Please wait, connecting you...
                            </p>
                            <p className="mt-1 text-sm font-semibold text-amber-700">
                                Do not close this page. Internet will open automatically.
                            </p>
                        </div>
                    )}

                    {isPaid && session && (
                        <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-sm font-black text-emerald-700">
                                Internet Login Details
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <div className="rounded-2xl bg-white p-3">
                                    <p className="text-xs font-bold text-slate-500">Username</p>
                                    <p className="mt-1 text-xl font-black">{session.username}</p>
                                </div>

                                <div className="rounded-2xl bg-white p-3">
                                    <p className="text-xs font-bold text-slate-500">Password</p>
                                    <p className="mt-1 text-xl font-black">{session.password}</p>
                                </div>

                                <div className="rounded-2xl bg-white p-3">
                                    <p className="text-xs font-bold text-slate-500">Expires</p>
                                    <p className="mt-1 font-black">
                                        {new Date(session.expiresAt).toLocaleString("en-KE")}
                                    </p>
                                </div>
                            </div>

                            {session.activationError && (
                                <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-600">
                                    {session.activationError}
                                </p>
                            )}
                        </div>
                    )}

                    {canAutoLogin ? (
                        <LoadingLinkButton
                            href={`/auto-login?sessionId=${session.id}`}
                            loadingText="Connecting..."
                            className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
                        >
                            Connect Now
                        </LoadingLinkButton>
                    ) : activationPending ? (
                        <button
                            disabled
                            className="mt-5 block w-full rounded-2xl bg-slate-200 px-4 py-3 text-center text-sm font-black text-slate-500"
                        >
                            Activating Internet...
                        </button>
                    ) : (
                        <LoadingLinkButton
                            href="/"
                            loadingText="Opening packages..."
                            className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
                        >
                            {isPaid ? "Buy More Time" : "Back to Packages"}
                        </LoadingLinkButton>
                    )}
                </section>
            </div>
        </main>
    );
}