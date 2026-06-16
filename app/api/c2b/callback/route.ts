import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHotspotUser } from "@/lib/mikrotik";
import { sendSms } from "@/lib/sms";

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-KE", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log("C2B/STK callback:", JSON.stringify(body, null, 2));

        const stkCallback = body?.Body?.stkCallback;

        const checkoutId = stkCallback?.CheckoutRequestID;
        const resultCode = stkCallback?.ResultCode;

        if (!checkoutId) {
            return NextResponse.json({ ok: false, error: "Missing checkoutId" });
        }

        const payment = await prisma.payment.findFirst({
            where: { checkoutId },
        });

        if (!payment) {
            return NextResponse.json({ ok: false, error: "Payment not found" });
        }

        if (payment.status === "PAID") {
            return NextResponse.json({ ok: true, message: "Already processed" });
        }

        if (resultCode === 0) {
            const metadata = stkCallback?.CallbackMetadata?.Item || [];

            const mpesaCode =
                metadata.find((item: any) => item.Name === "MpesaReceiptNumber")
                    ?.Value || null;

            const paidPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "PAID",
                    mpesaCode,
                },
            });

            const settings = await prisma.appSetting.findUnique({
                where: { id: "main" },
            });

            const portalName = settings?.portalName || "CRAFT WIFI";
            const portalUrl =
                settings?.portalUrl || "https://billing.craftinventors.co.ke";

            if (paidPayment.customerId && paidPayment.packageId) {
                const pkg = await prisma.internetPackage.findUnique({
                    where: { id: paidPayment.packageId },
                });

                if (pkg) {
                    const username = `${paidPayment.phone}-${Date.now().toString().slice(-5)}`;
                    const password = String(Math.floor(1000 + Math.random() * 9000));
                    const expiresAt = new Date(Date.now() + pkg.durationMin * 60 * 1000);

                    const session = await prisma.internetSession.create({
                        data: {
                            customerId: paidPayment.customerId,
                            packageId: pkg.id,
                            username,
                            password,
                            expiresAt,
                            active: true,
                            activationStatus: "PENDING",
                            activationError: null,
                        },
                    });

                    try {
                        await createHotspotUser({
                            username,
                            password,
                            durationMinutes: pkg.durationMin,
                            speedLimit: pkg.speedLimit,
                        });

                        await prisma.internetSession.update({
                            where: { id: session.id },
                            data: {
                                activationStatus: "ACTIVATED",
                                activationError: null,
                            },
                        });
                    } catch (routerError: any) {
                        console.error("MikroTik activation failed:", routerError);

                        await prisma.internetSession.update({
                            where: { id: session.id },
                            data: {
                                activationStatus: "FAILED",
                                activationError:
                                    routerError?.message || "MikroTik activation failed",
                            },
                        });
                    }

                    try {
                        await sendSms({
                            to: username,
                            message: `${portalName} payment received. Package: ${pkg.name
                                }. Username: ${username}. Password: ${password}. Expires: ${formatDateTime(
                                    expiresAt
                                )}. Connect to ${portalName}. Portal: ${portalUrl}`,
                        });
                    } catch (smsError) {
                        console.error("SMS failed:", smsError);
                    }
                }
            }
        } else {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "FAILED",
                },
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Callback error:", error);

        return NextResponse.json(
            { ok: false, error: error?.message || "Callback failed" },
            { status: 500 }
        );
    }
}