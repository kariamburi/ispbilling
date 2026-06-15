import { NextResponse } from "next/server";
import { RouterOSClient } from "routeros-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    let client: RouterOSClient | null = null;

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

        client = new RouterOSClient({
            host: router.host,
            user: router.username,
            password: router.password,
            port: router.port,
            timeout: 30000,
        });

        const api = await client.connect();

        const identity = await api.menu("/system/identity").get();
        const resource = await api.menu("/system/resource").get();

        return NextResponse.json({
            ok: true,
            message: "Connected to MikroTik successfully",
            router: {
                name: router.name,
                host: router.host,
                port: router.port,
                identity,
                resource,
            },
        });
    } catch (error: any) {
        console.error("Router test error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Failed to connect to MikroTik",
            },
            { status: 500 }
        );
    } finally {
        try {
            client?.close();
        } catch { }
    }
}