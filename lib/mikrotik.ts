import { RouterOSClient } from "routeros-client";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

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
}: {
    username: string;
    password: string;
    durationMinutes: number;
    speedLimit?: string | null;
}) {
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
        const existingUsers = await api.menu("/ip/hotspot/user").getAll();
        const existing = existingUsers.find((user: any) => user.name === username);

        if (existing?.[".id"]) {
            await api.menu("/ip/hotspot/user").remove(existing[".id"]);
        }

        await api.menu("/ip/hotspot/user").add({
            name: username,
            password,
            "limit-uptime": minutesToLimitUptime(durationMinutes),
            comment: "Created by Craft Billing",
        });

        return { ok: true };
    } finally {
        client.close();
    }
}