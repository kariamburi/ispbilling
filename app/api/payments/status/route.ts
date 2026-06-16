import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
        return NextResponse.json(
            { ok: false, error: "paymentId is required" },
            { status: 400 }
        );
    }

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
    });

    if (!payment) {
        return NextResponse.json(
            { ok: false, error: "Payment not found" },
            { status: 404 }
        );
    }

    const session = await prisma.internetSession.findFirst({
        where: {
            customerId: payment.customerId || undefined,
            packageId: payment.packageId || undefined,
            activationStatus: "ACTIVATED",
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
        ok: true,
        paymentStatus: payment.status,
        sessionId: session?.id || null,
    });
}