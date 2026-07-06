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

type RouterConnection = {
    client: RouterOSClient;
    api: any;
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

    return remainingMinutes === 0 ? `${hours}h` : `${hours}h${remainingMinutes}m`;
}

function cleanProfile(profile?: string | null) {
    const value = String(profile || "").trim();
    return value || "default";
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error || "Unknown MikroTik error");
}

function isAlreadyExistsError(error: unknown) {
    const message = getErrorMessage(error).toLowerCase();

    return (
        message.includes("already") ||
        message.includes("failure: already") ||
        message.includes("already have")
    );
}

async function connectRouter(): Promise<RouterConnection> {
    const router = await getActiveRouter();

    const client = new RouterOSClient({
        host: router.host,
        user: router.username,
        password: router.password,
        port: router.port,
        timeout: 30000,
    });

    const api: any = await client.connect();

    return { client, api };
}

export async function createHotspotUser({
    username,
    password,
    durationMinutes,
    speedLimit,
}: CreateHotspotUserArgs) {
    const { client, api } = await connectRouter();

    try {
        const limitUptime = minutesToLimitUptime(durationMinutes);
        const profile = cleanProfile(speedLimit);

        try {
            await api.write("/ip/hotspot/user/add", [
                `=name=${username}`,
                `=password=${password}`,
                `=profile=${profile}`,
                `=limit-uptime=${limitUptime}`,
                `=disabled=no`,
                `=comment=Created by Craft Billing`,
            ]);
        } catch (error: unknown) {
            if (isAlreadyExistsError(error)) {
                throw new Error(`Hotspot user ${username} already exists.`);
            }

            throw new Error(`MikroTik user creation failed: ${getErrorMessage(error)}`);
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

async function findHotspotUserId(api: any, username: string) {
    const users = await api.write("/ip/hotspot/user/print", [
        `?name=${username}`,
        "=.proplist=.id,name",
    ]);

    return users?.[0]?.[".id"] || null;
}

async function findActiveSessionId(api: any, username: string) {
    const sessions = await api.write("/ip/hotspot/active/print", [
        `?user=${username}`,
        "=.proplist=.id,user",
    ]);

    return sessions?.[0]?.[".id"] || null;
}

async function findCookieId(api: any, username: string) {
    const cookies = await api.write("/ip/hotspot/cookie/print", [
        `?user=${username}`,
        "=.proplist=.id,user",
    ]);

    return cookies?.[0]?.[".id"] || null;
}

export async function removeHotspotUser(username: string) {
    const { client, api } = await connectRouter();

    try {
        const userId = await findHotspotUserId(api, username);

        if (!userId) return true;

        await api.write("/ip/hotspot/user/remove", [`=.id=${userId}`]);

        return true;
    } catch (error) {
        console.error("Remove hotspot user failed:", error);
        return false;
    } finally {
        try {
            client.close();
        } catch { }
    }
}

export async function cleanupHotspotUser(username: string) {
    const { client, api } = await connectRouter();

    try {
        const activeId = await findActiveSessionId(api, username);
        if (activeId) {
            await api.write("/ip/hotspot/active/remove", [`=.id=${activeId}`]);
        }

        const cookieId = await findCookieId(api, username);
        if (cookieId) {
            await api.write("/ip/hotspot/cookie/remove", [`=.id=${cookieId}`]);
        }

        const userId = await findHotspotUserId(api, username);
        if (userId) {
            await api.write("/ip/hotspot/user/remove", [`=.id=${userId}`]);
        }

        return true;
    } catch (error) {
        console.error("Cleanup hotspot user failed:", error);
        return false;
    } finally {
        try {
            client.close();
        } catch { }
    }
}