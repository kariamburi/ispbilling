import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LoadingLinkButton from "../../LoadingLinkButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
    params: Promise<{ id: string }>;
};

export default async function TrialPage({ params }: Props) {
    const { id } = await params;

    const settings = await prisma.appSetting.findUnique({
        where: { id: "main" },
    });

    const session = await prisma.internetSession.findUnique({
        where: { id },
        include: { customer: true },
    });

    if (!session) notFound();

    const portalName = settings?.portalName || "CRAFT WIFI";

    const activationPending = session.activationStatus === "PENDING";
    const canAutoLogin = session.activationStatus === "ACTIVATED";

    return (
        <main className="min-h-screen bg-[#061b13] text-white">
            {activationPending && <meta httpEquiv="refresh" content="2" />}

            {canAutoLogin && (
                <meta
                    httpEquiv="refresh"
                    content={`2;url=/auto-login?sessionId=${session.id}`}
                />
            )}

            {activationPending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-6 text-white">
                    <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center text-slate-950 shadow-2xl">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                            <span className="animate-pulse text-5xl">📶</span>
                        </div>

                        <h2 className="mt-5 text-2xl font-black">
                            Activating your trial...
                        </h2>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                            Please wait while we connect your device to the internet.
                        </p>

                        <div className="mt-5 flex items-center justify-center gap-2">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                            <span className="text-sm font-black text-emerald-700">
                                Connecting...
                            </span>
                        </div>

                        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-700">
                            Please wait. Internet will open automatically.
                        </p>
                    </div>
                </div>
            )}

            <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
                            Free Trial
                        </p>
                        <h1 className="mt-1 text-2xl font-black">{portalName}</h1>
                    </div>

                    <div
                        className={`rounded-full border px-4 py-2 text-xs font-bold ${activationPending
                            ? "border-amber-400/30 bg-amber-500/20 text-amber-200"
                            : "border-emerald-400/30 bg-white/10 text-emerald-200"
                            }`}
                    >
                        {activationPending ? "Connecting..." : "Activated"}
                    </div>
                </header>

                <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-6 text-slate-950 shadow-2xl">
                    <p className="text-sm font-black uppercase tracking-wide">
                        {activationPending ? "Activating Trial" : "Trial Activated"}
                    </p>

                    <h2 className="mt-3 text-3xl font-black leading-tight">
                        {activationPending
                            ? "Connecting your internet..."
                            : "Your free internet trial is ready."}
                    </h2>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                        {activationPending
                            ? "Please wait while we activate your session."
                            : `Use the login details below to connect to ${portalName}.`}
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
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <span className="text-3xl font-black">✓</span>
                            </div>
                        )}
                    </div>

                    <h2 className="mt-4 text-center text-xl font-black">
                        {activationPending ? "Activating Internet..." : "Free Trial Activated"}
                    </h2>

                    <p className="mt-2 text-center text-sm font-semibold text-slate-500">
                        {activationPending
                            ? "Please wait. Do not click back or close this page."
                            : "Save these details. You may need them to login again."}
                    </p>

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

                            <div className="rounded-2xl bg-white p-3">
                                <p className="text-xs font-bold text-slate-500">Activation</p>
                                <p className="mt-1 font-black">{session.activationStatus}</p>
                            </div>
                        </div>

                        {session.activationError && (
                            <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-600">
                                {session.activationError}
                            </p>
                        )}
                    </div>

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
                            Buy More Time
                        </LoadingLinkButton>
                    )}
                </section>
            </div>
        </main>
    );
}