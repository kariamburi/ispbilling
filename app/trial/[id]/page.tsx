import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LoadingLinkButton from "../../LoadingLinkButton";

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
        include: {
            customer: true,
        },
    });

    if (!session) notFound();

    const portalName = settings?.portalName || "CRAFT WIFI";

    return (
        <main className="min-h-screen bg-[#061b13] text-white">
            <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
                            Free Trial
                        </p>
                        <h1 className="mt-1 text-2xl font-black">{portalName}</h1>
                    </div>

                    <div className="rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-200">
                        Activated
                    </div>
                </header>

                <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-6 text-slate-950 shadow-2xl">
                    <p className="text-sm font-black uppercase tracking-wide">
                        Trial Activated
                    </p>

                    <h2 className="mt-3 text-3xl font-black leading-tight">
                        Your free internet trial is ready.
                    </h2>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                        Use the login details below to connect to {portalName}.
                    </p>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
                    <div className="flex items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <span className="text-3xl font-black">✓</span>
                        </div>
                    </div>

                    <h2 className="mt-4 text-center text-xl font-black">
                        Free Trial Activated
                    </h2>

                    <p className="mt-2 text-center text-sm font-semibold text-slate-500">
                        Save these details. You may need them to login again.
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
                                    {new Date(session.expiresAt).toLocaleString()}
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

                    <LoadingLinkButton
                        href="/"
                        loadingText="Opening packages..."
                        className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
                    >
                        Buy More Time
                    </LoadingLinkButton>
                </section>

                <footer className="mt-auto border-t border-white/10 pt-5 text-center text-xs text-slate-400">
                    <p>© {new Date().getFullYear()} {portalName}</p>

                    <p className="mt-2">
                        Powered by{" "}
                        <a
                            href="https://craftinventors.co.ke"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-black text-emerald-300 underline-offset-4 hover:underline"
                        >
                            Craft Inventors
                        </a>
                    </p>
                </footer>
            </div>
        </main>
    );
}