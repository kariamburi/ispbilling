import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const result = await prisma.internetSession.updateMany({
        where: {
            active: true,
            expiresAt: { lte: new Date() },
        },
        data: {
            active: false,
        },
    });

    return NextResponse.json({
        ok: true,
        expiredSessions: result.count,
    });
}