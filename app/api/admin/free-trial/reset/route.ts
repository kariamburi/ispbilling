import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { removeHotspotUser } from "@/lib/mikrotik";

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
        const rawMac = String(formData.get("mac") || "");

        const phone = rawPhone ? normalizePhone(rawPhone) : "";
        const mac = rawMac.trim();

        if (!phone && !mac) {
            return NextResponse.json(
                { ok: false, error: "Phone or MAC is required" },
                { status: 400 }
            );
        }

        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    phone ? { phone } : undefined,
                    mac ? { mac } : undefined,
                ].filter(Boolean) as any,
            },
            select: {
                id: true,
                phone: true,
                mac: true,
            },
        });

        if (customers.length === 0) {
            return NextResponse.json({
                ok: true,
                message: "No customer found, nothing to reset",
            });
        }

        const customerIds = customers.map((c) => c.id);
        const phones = customers.map((c) => c.phone).filter(Boolean);

        await prisma.internetSession.deleteMany({
            where: {
                customerId: { in: customerIds },
            },
        });

        await prisma.payment.deleteMany({
            where: {
                customerId: { in: customerIds },
            },
        });

        await prisma.customer.updateMany({
            where: {
                id: { in: customerIds },
            },
            data: {
                freeTrialUsed: false,
                freeTrialUsedAt: null,
                blocked: false,
                mac: null,
            },
        });

        // Later enable this after your removeHotspotUser() is ready
        // for (const username of phones) {
        //   await removeHotspotUser(username);
        // }

        return NextResponse.json({
            ok: true,
            message: "Free trial reset successfully",
            resetCustomers: customers.length,
            resetPhones: phones,
        });
    } catch (error: any) {
        console.error("Reset free trial error:", error);

        return NextResponse.json(
            { ok: false, error: error?.message || "Reset failed" },
            { status: 500 }
        );
    }
}