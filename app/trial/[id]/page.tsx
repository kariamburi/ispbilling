import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-md">
                <div className="rounded-3xl bg-white p-6 text-center text-slate-950">
                    <h1 className="text-2xl font-black">
                        {settings?.portalName || "CRAFT WIFI"}
                    </h1>
                    <p className="mt-2 text-slate-600">Free Trial Activated</p>

                    <p className="mt-3 text-slate-600">
                        Use these details to login to {settings?.portalName || "CRAFT WIFI"}.
                    </p>

                    <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-left">
                        <p className="text-sm text-slate-500">Username</p>
                        <p className="text-xl font-black">{session.username}</p>

                        <p className="mt-3 text-sm text-slate-500">Password</p>
                        <p className="text-xl font-black">{session.password}</p>

                        <p className="mt-3 text-sm text-slate-500">Expires</p>
                        <p className="font-bold">
                            {new Date(session.expiresAt).toLocaleString()}
                        </p>

                        <p className="mt-3 text-sm text-slate-500">Activation</p>
                        <p className="font-bold">{session.activationStatus}</p>
                    </div>

                    <a
                        href="/"
                        className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950"
                    >
                        Buy More Time
                    </a>
                </div>
            </div>
        </main>
    );
}