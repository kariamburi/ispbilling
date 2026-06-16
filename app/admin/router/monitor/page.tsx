import { prisma } from "@/lib/prisma";
import { RouterOSClient } from "routeros-client";
import { Cpu, HardDrive, Router, Signal, Users, Wifi } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MonitorData = {
    router: any;
    connected: boolean;
    error: string | null;
    identity: any;
    resource: any;
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
            timeout: 10000,
        });

        const api = await client.connect();

        let identity: any = null;
        let resource: any = null;
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

    const cards = [
        {
            label: "Router",
            value: data.router?.name || "Not configured",
            hint: data.router?.location || "MikroTik gateway",
            icon: Router,
        },
        {
            label: "Host",
            value: data.router?.host || "-",
            hint: `API Port ${data.router?.port || 8728}`,
            icon: Signal,
        },
        {
            label: "Status",
            value: data.connected ? "Online" : "Offline",
            hint: data.connected ? "API reachable" : data.error || "Not connected",
            icon: Wifi,
        },
        {
            label: "Identity",
            value: data.identity?.name || "-",
            hint: "Router identity",
            icon: Router,
        },
        {
            label: "Uptime",
            value: data.resource?.uptime || "-",
            hint: "Router uptime",
            icon: ClockIcon,
        },
        {
            label: "CPU Load",
            value:
                data.resource?.["cpu-load"] !== undefined
                    ? `${data.resource["cpu-load"]}%`
                    : "-",
            hint: "Current CPU usage",
            icon: Cpu,
        },
        {
            label: "Free Memory",
            value: data.resource?.["free-memory"]
                ? `${Math.round(Number(data.resource["free-memory"]) / 1024 / 1024)} MB`
                : "-",
            hint: "Available RAM",
            icon: HardDrive,
        },
        {
            label: "Online Users",
            value: data.activeHotspotUsers.length,
            hint: "Authenticated hotspot users",
            icon: Users,
        },
    ];

    return (
        <main className="p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Router Monitor</h1>
                    <p className="mt-1 text-slate-300">
                        MikroTik live status and hotspot activity
                    </p>
                </div>

                {!data.connected && (
                    <div className="mb-6 rounded-3xl bg-red-50 p-5 text-red-700 shadow">
                        <p className="font-black">Router connection failed</p>
                        <p className="mt-1 text-sm">{data.error}</p>
                        <p className="mt-2 text-sm">
                            Confirm Host is <b>10.10.10.2</b>, API port <b>8728</b> is
                            enabled, and WireGuard VPN is connected.
                        </p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div key={card.label} className="rounded-3xl bg-white p-5 shadow">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-500">
                                        {card.label}
                                    </p>
                                    <Icon className="h-5 w-5 text-slate-500" />
                                </div>

                                <p
                                    className={`mt-3 text-2xl font-black ${card.label === "Status"
                                        ? data.connected
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                        : "text-slate-950"
                                        }`}
                                >
                                    {card.value}
                                </p>

                                <p className="mt-1 text-xs font-bold text-slate-400">
                                    {card.hint}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow">
                    <div className="border-b p-5">
                        <h2 className="text-xl font-black text-slate-950">
                            Active Hotspot Users
                        </h2>
                    </div>

                    <table className="w-full min-w-[800px] text-left text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">MAC Address</th>
                                <th className="p-4">Uptime</th>
                                <th className="p-4">Time Left</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.activeHotspotUsers.map((user: any) => (
                                <tr key={user[".id"] || user.user} className="border-t">
                                    <td className="p-4 font-bold">{user.user || "-"}</td>
                                    <td className="p-4">{user.address || "-"}</td>
                                    <td className="p-4">{user["mac-address"] || "-"}</td>
                                    <td className="p-4">{user.uptime || "-"}</td>
                                    <td className="p-4">{user["session-time-left"] || "-"}</td>
                                </tr>
                            ))}

                            {data.activeHotspotUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-500">
                                        No active hotspot users yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <a href="/admin" className="text-sm font-bold underline">
                        Dashboard
                    </a>
                    <a href="/admin/sessions" className="text-sm font-bold underline">
                        Sessions
                    </a>
                </div>
            </div>
        </main>
    );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
        </svg>
    );
}