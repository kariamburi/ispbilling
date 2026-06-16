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
    speedLimit,
}: CreateHotspotUserArgs) {
    const router = await getActiveRouter();

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 10000,
    });

    const api = await client.connect();

    try {
        const limitUptime = minutesToLimitUptime(durationMinutes);
        const profile = speedLimit || "default";

        try {
            await api.menu("/ip/hotspot/user").add({
                name: username,
                password,
                profile,
                "limit-uptime": limitUptime,
                disabled: "no",
                comment: "Created by Craft Billing",
            });
        } catch (error: any) {
            const message = String(error?.message || "").toLowerCase();

            if (message.includes("already have user")) {
                throw new Error(
                    `Hotspot user ${username} already exists. Remove it from MikroTik before retrying.`
                );
            }

            throw error;
        }

        return {
            ok: true,
            username,
            limitUptime,
            profile,
        };
    } finally {
        try {
            client.close();
        } catch { }
    }
}
export async function removeHotspotUser(username: string) {
    const router = await getActiveRouter();

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 10000,
    });

    const api = await client.connect();

    try {
        try {
            await api.menu("/ip/hotspot/user").remove(username);
        } catch (error) {
            console.error("Remove hotspot user failed:", error);
        }

        return true;
    } finally {
        try {
            client.close();
        } catch { }
    }
}