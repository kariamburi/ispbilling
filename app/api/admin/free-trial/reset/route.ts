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

        if (!rawPhone) {
            return NextResponse.json(
                { ok: false, error: "Phone number is required" },
                { status: 400 }
            );
        }

        const phone = normalizePhone(rawPhone);

        const customer = await prisma.customer.update({
            where: { phone },
            data: {
                freeTrialUsed: false,
                freeTrialUsedAt: null,
            },
        });

        return NextResponse.json({
            ok: true,
            message: `Free trial reset for ${customer.phone}`,
        });
    } catch (error: any) {
        return NextResponse.json(
            { ok: false, error: error?.message || "Reset failed" },
            { status: 500 }
        );
    }
}