import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupHotspotUser } from "@/lib/mikrotik";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const expiredSessions = await prisma.internetSession.findMany({
        where: {
            active: true,
            expiresAt: {
                lte: new Date(),
            },
            username: {
                not: null,
            },
        },
        select: {
            id: true,
            username: true,
        },
    });

    let cleanedRouterUsers = 0;
    const cleanupErrors: string[] = [];

    for (const session of expiredSessions) {
        if (!session.username) continue;

        try {
            await cleanupHotspotUser(session.username);
            cleanedRouterUsers++;
        } catch (error: any) {
            cleanupErrors.push(
                `${session.username}: ${error?.message || "Cleanup failed"}`
            );
        }
    }

    const result = await prisma.internetSession.updateMany({
        where: {
            id: {
                in: expiredSessions.map((s) => s.id),
            },
        },
        data: {
            active: false,
        },
    });

    return NextResponse.json({
        ok: true,
        expiredSessions: result.count,
        cleanedRouterUsers,
        cleanupErrors,
    });
}