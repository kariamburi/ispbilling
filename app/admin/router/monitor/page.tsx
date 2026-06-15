import { prisma } from "@/lib/prisma";
import { RouterOSClient } from "routeros-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MonitorData = {
    router: any;
    connected: boolean;
    error: string | null;
    identity: any;
    resource: any;
    hotspotUsers: any[];
    activeHotspotUsers: any[];
};

async function getRouterStats(): Promise<MonitorData> {
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

    let client: RouterOSClient | null = null;

    try {
        client = new RouterOSClient({
            host: router.host,
            user: router.username,
            password: router.password,
            port: router.port,
            timeout: 30000,
        });

        const api = await client.connect();

        let identity: any = null;
        let resource: any = null;
        let hotspotUsers: any[] = [];
        let activeHotspotUsers: any[] = [];

        try {
            identity = await api.menu("/system/identity").get();
        } catch (error) {
            console.error("Monitor identity failed:", error);
        }

        try {
            resource = await api.menu("/system/resource").get();
        } catch (error) {
            console.error("Monitor resource failed:", error);
        }

        try {
            hotspotUsers = await api.menu("/ip/hotspot/user").getAll();
        } catch (error) {
            console.error("Monitor hotspot users failed:", error);
        }

        try {
            activeHotspotUsers = await api.menu("/ip/hotspot/active").getAll();
        } catch (error) {
            console.error("Monitor active users failed:", error);
        }

        return {
            router,
            connected: Boolean(identity),
            error: identity ? null : "Connected to router, but failed to read identity",
            identity,
            resource,
            hotspotUsers,
            activeHotspotUsers,
        };
    } catch (error: any) {
        console.error("Router monitor error:", error);

        return {
            router,
            connected: false,
            error: error?.message || "Failed to connect to MikroTik",
            identity: null,
            resource: null,
            hotspotUsers: [],
            activeHotspotUsers: [],
        };
    } finally {
        try {
            client?.close();
        } catch { }
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
                            {data.identity?.name || "-"}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Uptime</p>
                        <p className="mt-3 text-xl font-black">
                            {data.resource?.uptime || "-"}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">CPU Load</p>
                        <p className="mt-3 text-xl font-black">
                            {data.resource?.["cpu-load"] ?? "-"}%
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
                                <tr key={user[".id"] || user.user} className="border-t">
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