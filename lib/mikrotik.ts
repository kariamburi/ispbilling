import { RouterOSClient } from "routeros-client";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type CreateHotspotUserArgs = {
    username: string;
    password: string;
    durationMinutes: number;
    speedLimit?: string | null;
};

export async function getActiveRouter() {
    const router = await prisma.router.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });

    if (!router) {
        throw new Error("No active MikroTik router configured");
    }

    return router;
}

function minutesToLimitUptime(minutes: number) {
    if (!minutes || minutes <= 0) return "30m";

    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h${remainingMinutes}m`;
}

export async function createHotspotUser({
    username,
    password,
    durationMinutes,
}: CreateHotspotUserArgs) {
    const router = await getActiveRouter();

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 30000,
    });

    const api = await client.connect();

    try {
        const limitUptime = minutesToLimitUptime(durationMinutes);

        const activeUsers = await api.menu("/ip/hotspot/active").getAll();
        const active = activeUsers.find((user: any) => user.user === username);

        if (active?.[".id"]) {
            await api.menu("/ip/hotspot/active").remove([active[".id"]]);
        }

        const existingUsers = await api.menu("/ip/hotspot/user").getAll();
        const existing = existingUsers.find((user: any) => user.name === username);

        if (existing?.[".id"]) {
            await api.menu("/ip/hotspot/user").update({
                ".id": existing[".id"],
                password,
                "limit-uptime": limitUptime,
                comment: "Updated by Craft Billing",
            });
        } else {
            await api.menu("/ip/hotspot/user").add({
                name: username,
                password,
                "limit-uptime": limitUptime,
                comment: "Created by Craft Billing",
            });
        }

        return {
            ok: true,
            username,
            limitUptime,
        };
    } finally {
        try {
            client.close();
        } catch { }
    }
}