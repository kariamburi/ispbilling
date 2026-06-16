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

    console.log("STEP 1: getActiveRouter");

    const router = await getActiveRouter();

    console.log("STEP 2: router found", router.host);

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 10000,
    });

    console.log("STEP 3: connecting");

    const api = await client.connect();

    console.log("STEP 4: connected");

    try {
        const limitUptime = minutesToLimitUptime(durationMinutes);

        console.log("STEP 5: limit uptime", limitUptime);

        const activeUsers = await api.menu("/ip/hotspot/active").getAll();

        console.log("STEP 6: active users loaded", activeUsers.length);

        const existingUsers = await api.menu("/ip/hotspot/user").getAll();

        console.log("STEP 7: hotspot users loaded", existingUsers.length);

        return {
            ok: true,
            username,
            limitUptime,
        };
    } finally {
        client.close();
    }
}