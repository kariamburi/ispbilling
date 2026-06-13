import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const url = new URL(req.url);

    const from = url.searchParams.get("from")
        ? new Date(url.searchParams.get("from")!)
        : null;

    const to = url.searchParams.get("to")
        ? new Date(url.searchParams.get("to")!)
        : null;

    if (to) to.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
        where: {
            status: "PAID",
            ...(from || to
                ? {
                    createdAt: {
                        ...(from ? { gte: from } : {}),
                        ...(to ? { lte: to } : {}),
                    },
                }
                : {}),
        },
        orderBy: { createdAt: "desc" },
    });

    const rows = [
        ["Phone", "Amount", "Status", "M-Pesa Code", "Date"],
        ...payments.map((p) => [
            p.phone,
            String(p.amount),
            p.status,
            p.mpesaCode || "",
            new Date(p.createdAt).toLocaleString(),
        ]),
    ];

    const csv = rows.map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="craft-billing-report.csv"`,
        },
    });
}