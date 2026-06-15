import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string) {
    let value = phone.trim().replace(/\s+/g, "");

    if (value.startsWith("07")) value = "254" + value.substring(1);
    if (value.startsWith("+254")) value = value.substring(1);

    return value;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const rawPhone = String(formData.get("phone") || "");
        const mac = String(formData.get("mac") || "");

        if (!rawPhone && !mac) {
            return NextResponse.json(
                { ok: false, error: "Phone or MAC is required" },
                { status: 400 }
            );
        }

        const phone = rawPhone ? normalizePhone(rawPhone) : "";

        if (phone) {
            await prisma.customer.updateMany({
                where: { phone },
                data: {
                    freeTrialUsed: false,
                    freeTrialUsedAt: null,
                },
            });
        }

        if (mac) {
            await prisma.customer.updateMany({
                where: { mac },
                data: {
                    freeTrialUsed: false,
                    freeTrialUsedAt: null,
                },
            });
        }

        return NextResponse.json({
            ok: true,
            message: "Free trial reset successfully",
        });
    } catch (error: any) {
        return NextResponse.json(
            { ok: false, error: error?.message || "Reset failed" },
            { status: 500 }
        );
    }
}