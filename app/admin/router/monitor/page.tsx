import { prisma } from "@/lib/prisma";
import { RouterOSClient } from "routeros-client";

async function getRouterStats() {
    const router = await prisma.router.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });

    if (!router) {
        return {
            router: null,
            connected: false,
            error: "No active router configured",
            identity: null,
            resource: null,
            hotspotUsers: [],
            activeHotspotUsers: [],
        };
    }

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 10,
    });

    try {
        const api = await client.connect();

        const identity = await api.menu("/system/identity").get();
        const resource = await api.menu("/system/resource").get();

        const hotspotUsers = await api.menu("/ip/hotspot/user").getAll();
        const activeHotspotUsers = await api.menu("/ip/hotspot/active").getAll();

        client.close();

        return {
            router,
            connected: true,
            error: null,
            identity,
            resource,
            hotspotUsers,
            activeHotspotUsers,
        };
    } catch (error: any) {
        try {
            client.close();
        } catch { }

        return {
            router,
            connected: false,
            error: error?.message || "Failed to connect to MikroTik",
            identity: null,
            resource: null,
            hotspotUsers: [],
            activeHotspotUsers: [],
        };
    }
}

export default async function RouterMonitorPage() {
    const data = await getRouterStats();

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Router Monitor</h1>
                    <p className="mt-1 text-slate-300">
                        MikroTik live status and network statistics
                    </p>
                </div>

                {!data.connected && (
                    <div className="mb-6 rounded-3xl bg-red-50 p-5 text-red-700 shadow">
                        <p className="font-black">Router connection failed</p>
                        <p className="mt-1 text-sm">{data.error}</p>
                        <p className="mt-2 text-sm">
                            Confirm Host is <b>10.10.10.2</b>, API port <b>8728</b> is enabled,
                            and WireGuard VPN is connected.
                        </p>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Router</p>
                        <p className="mt-3 text-2xl font-black">
                            {data.router?.name || "Not configured"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Host</p>
                        <p className="mt-3 text-2xl font-black">
                            {data.router?.host || "-"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Status</p>
                        <p
                            className={`mt-3 text-2xl font-black ${data.connected ? "text-emerald-600" : "text-red-600"
                                }`}
                        >
                            {data.connected ? "Online" : "Offline"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Identity</p>
                        <p className="mt-3 text-2xl font-black">
                            {(data.identity as any)?.name || "-"}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Uptime</p>
                        <p className="mt-3 text-xl font-black">
                            {(data.resource as any)?.uptime || "-"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">CPU Load</p>
                        <p className="mt-3 text-xl font-black">
                            {(data.resource as any)?.["cpu-load"] ?? "-"}%
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Hotspot Users</p>
                        <p className="mt-3 text-xl font-black">
                            {data.hotspotUsers.length}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Online Users</p>
                        <p className="mt-3 text-xl font-black">
                            {data.activeHotspotUsers.length}
                        </p>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow">
                    <div className="border-b p-5">
                        <h2 className="text-xl font-black">Active Hotspot Users</h2>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">IP</th>
                                <th className="p-4">MAC</th>
                                <th className="p-4">Uptime</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.activeHotspotUsers.map((user: any) => (
                                <tr key={user[".id"]} className="border-t">
                                    <td className="p-4 font-bold">{user.user || "-"}</td>
                                    <td className="p-4">{user.address || "-"}</td>
                                    <td className="p-4">{user["mac-address"] || "-"}</td>
                                    <td className="p-4">{user.uptime || "-"}</td>
                                </tr>
                            ))}

                            {data.activeHotspotUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-slate-500">
                                        No active hotspot users yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}