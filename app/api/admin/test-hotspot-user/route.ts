import { NextResponse } from "next/server";
import { createHotspotUser } from "@/lib/mikrotik";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        console.log("TEST_HOTSPOT_USER: request received");

        const body = await req.json();

        console.log("TEST_HOTSPOT_USER: body", body);

        const username = String(body.username || "");
        const password = String(body.password || "1234");
        const durationMinutes = Number(body.durationMinutes || 30);
        const speedLimit = body.speedLimit ? String(body.speedLimit) : null;

        if (!username) {
            return NextResponse.json(
                { ok: false, error: "Username is required" },
                { status: 400 }
            );
        }

        console.log("TEST_HOTSPOT_USER: calling createHotspotUser");

        const result = await createHotspotUser({
            username,
            password,
            durationMinutes,
            speedLimit,
        });

        console.log("TEST_HOTSPOT_USER: success", result);

        return NextResponse.json({
            ok: true,
            message: "Hotspot user created/updated successfully",
            result,
        });
    } catch (error: any) {
        console.error("TEST_HOTSPOT_USER_ERROR:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Failed to create hotspot user",
            },
            { status: 500 }
        );
    }
}