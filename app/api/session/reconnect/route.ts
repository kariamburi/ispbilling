// app/api/session/reconnect/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://billing.craftinventors.co.ke";

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    // Kenyan local format: 07XXXXXXXX or 01XXXXXXXX
    if (/^0[17]\d{8}$/.test(digits)) {
        return `254${digits.slice(1)}`;
    }

    // Kenyan international format: 2547XXXXXXXX or 2541XXXXXXXX
    if (/^254[17]\d{8}$/.test(digits)) {
        return digits;
    }

    // Without country code: 7XXXXXXXX or 1XXXXXXXX
    if (/^[17]\d{8}$/.test(digits)) {
        return `254${digits}`;
    }

    // Invalid number
    return "";
}
export async function POST(req: Request) {
    const formData = await req.formData();

    const phone = normalizePhone(String(formData.get("phone") || ""));
    const mac = String(formData.get("mac") || "").trim();

    if (!phone) {
        const url = new URL("/", APP_URL);
        url.searchParams.set("error", "missing_phone");
        return NextResponse.redirect(url, 303);
    }

    const session = await prisma.internetSession.findFirst({
        where: {
            active: true,
            expiresAt: { gt: new Date() },
            activationStatus: "ACTIVATED",
            username: { not: null },
            password: { not: null },
            customer: {
                phone,
                blocked: false,
            },
        },
        orderBy: {
            expiresAt: "desc",
        },
        include: {
            customer: true,
        },
    });

    if (!session) {
        const url = new URL("/", APP_URL);
        url.searchParams.set("error", "no_active_session");

        if (mac) {
            url.searchParams.set("mac", mac);
        }

        return NextResponse.redirect(url, 303);
    }

    if (mac && session.mac !== mac) {
        await prisma.internetSession.update({
            where: { id: session.id },
            data: { mac },
        });
    }

    return NextResponse.redirect(
        new URL(`/auto-login?sessionId=${session.id}`, APP_URL),
        303
    );
}