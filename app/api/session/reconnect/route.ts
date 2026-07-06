// app/api/session/reconnect/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string) {
    let value = phone.trim().replace(/\s+/g, "");

    if (value.startsWith("07")) value = "254" + value.substring(1);
    if (value.startsWith("+254")) value = value.substring(1);

    return value;
}

export async function POST(req: Request) {
    const formData = await req.formData();

    const phone = normalizePhone(String(formData.get("phone") || ""));
    const mac = String(formData.get("mac") || "").trim();

    if (!phone) {
        return NextResponse.redirect(new URL("/?error=missing_phone", req.url), 303);
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
        const url = new URL("/", req.url);
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
        new URL(`/auto-login?sessionId=${session.id}`, req.url),
        303
    );
}