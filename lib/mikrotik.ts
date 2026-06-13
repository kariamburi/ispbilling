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

export async function createHotspotUser({
    username,
    password,
    durationMinutes,
    speedLimit,
}: {
    username: string;
    password: string;
    durationMinutes: number;
    speedLimit: string;
}) {
    const router = await getActiveRouter();

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 10,
    });

    const api = await client.connect();

    try {
        const limitUptime = `${durationMinutes}m`;

        await api.menu("/ip/hotspot/user").add({
            name: username,
            password,
            "limit-uptime": limitUptime,
            "rate-limit": speedLimit,
            comment: "Created by Craft Billing",
        });

        return { ok: true };
    } finally {
        client.close();
    }
}