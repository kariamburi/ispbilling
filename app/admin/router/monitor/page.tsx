import { prisma } from "@/lib/prisma";

export default async function RouterMonitorPage() {
    const router = await prisma.router.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Router Monitor</h1>
                    <p className="mt-1 text-slate-300">
                        MikroTik live status and network statistics
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Router</p>
                        <p className="mt-3 text-2xl font-black">
                            {router?.name || "Not configured"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Host</p>
                        <p className="mt-3 text-2xl font-black">
                            {router?.host || "-"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Status</p>
                        <p className="mt-3 text-2xl font-black text-orange-600">
                            Pending Connection
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white p-6 shadow">
                    <h2 className="text-xl font-black">Coming Next</h2>
                    <p className="mt-2 text-slate-600">
                        After deployment to VPS and MikroTik connection, this page will show
                        online users, bandwidth usage, router uptime, CPU load, memory usage,
                        and hotspot users.
                    </p>
                </div>
            </div>
        </main>
    );
}