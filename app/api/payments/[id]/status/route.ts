import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(_req: Request, { params }: Props) {
    try {
        const { id } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Payment not found",
                },
                {
                    status: 404,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const session =
            payment.customerId && payment.packageId
                ? await prisma.internetSession.findFirst({
                    where: {
                        customerId: payment.customerId,
                        packageId: payment.packageId,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                })
                : null;

        return NextResponse.json(
            {
                ok: true,
                status: payment.status,
                paymentStatus: payment.status,
                mpesaCode: payment.mpesaCode || null,
                sessionId: session?.id || null,
                activationStatus:
                    session?.activationStatus || null,
            },
            {
                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate, proxy-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                },
            }
        );
    } catch (error: any) {
        console.error("Payment status check error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error?.message ||
                    "Unable to check payment status",
            },
            { status: 500 }
        );
    }
}