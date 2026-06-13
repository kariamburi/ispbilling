import { NextResponse } from "next/server";
import { RouterOSClient } from "routeros-client";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const router = await prisma.router.findFirst({
            where: { active: true },
            orderBy: { createdAt: "desc" },
        });

        if (!router) {
            return NextResponse.json(
                { ok: false, error: "No active router configured" },
                { status: 404 }
            );
        }

        const client = new RouterOSClient({
            host: router.host,
            user: router.username,
            password: router.password,
            port: router.port,
            timeout: 10,
        });

        const api = await client.connect();

        try {
            const identity = await api.menu("/system/identity").get();

            return NextResponse.json({
                ok: true,
                message: "Connected to MikroTik successfully",
                router: identity,
            });
        } finally {
            client.close();
        }
    } catch (error: any) {
        console.error("Router test error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Failed to connect to MikroTik",
            },
            { status: 500 }
        );
    }
}