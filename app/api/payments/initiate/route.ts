import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStkPush } from "@/lib/mpesa";
import { createHotspotUser } from "@/lib/mikrotik";
import { sendSms } from "@/lib/sms";

const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://billing.craftinventors.co.ke";

function normalizePhone(phone: string) {
    let value = phone.trim().replace(/\s+/g, "");

    if (value.startsWith("07")) {
        value = "254" + value.substring(1);
    }

    if (value.startsWith("01")) {
        value = "254" + value.substring(1);
    }

    if (value.startsWith("+254")) {
        value = value.substring(1);
    }

    return value;
}

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-KE", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

export async function POST(req: Request) {
    let createdPaymentId: string | null = null;

    try {
        const formData = await req.formData();

        const packageId = String(formData.get("packageId") || "").trim();
        const rawPhone = String(formData.get("phone") || "").trim();
        const mac = String(formData.get("mac") || "").trim();

        if (!packageId || !rawPhone) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Package and phone are required.",
                },
                { status: 400 }
            );
        }

        const phone = normalizePhone(rawPhone);

        if (!/^254(7|1)\d{8}$/.test(phone)) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Enter a valid Safaricom number, for example 0712345678.",
                },
                { status: 400 }
            );
        }

        const settings = await prisma.appSetting.findUnique({
            where: { id: "main" },
        });

        const portalName = settings?.portalName || "CRAFT WIFI";
        const portalUrl = settings?.portalUrl || APP_URL;

        const internetPackage =
            await prisma.internetPackage.findUnique({
                where: { id: packageId },
            });

        if (!internetPackage) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Package not found.",
                },
                { status: 404 }
            );
        }

        const customer = await prisma.customer.upsert({
            where: { phone },
            update: mac ? { mac } : {},
            create: {
                phone,
                mac: mac || null,
            },
        });

        if (customer.blocked) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Your account has been blocked. Please contact support.",
                },
                { status: 403 }
            );
        }

        /*
         * FREE TRIAL
         */
        if (internetPackage.isFreeTrial) {
            if (customer.freeTrialUsed) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "This phone number has already used the free trial.",
                    },
                    { status: 409 }
                );
            }

            if (mac) {
                const macUsed = await prisma.customer.findFirst({
                    where: {
                        mac,
                        freeTrialUsed: true,
                    },
                });

                if (macUsed) {
                    return NextResponse.json(
                        {
                            ok: false,
                            error:
                                "This device has already used the free trial.",
                        },
                        { status: 409 }
                    );
                }
            }

            const username = `${phone}-${Date.now()
                .toString()
                .slice(-5)}`;

            const password = String(
                Math.floor(1000 + Math.random() * 9000)
            );

            const expiresAt = new Date(
                Date.now() +
                internetPackage.durationMin * 60 * 1000
            );

            const session =
                await prisma.internetSession.create({
                    data: {
                        customerId: customer.id,
                        packageId: internetPackage.id,
                        mac: mac || null,
                        username,
                        password,
                        expiresAt,
                        active: true,
                        activationStatus: "PENDING",
                        activationError: null,
                    },
                });

            await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    freeTrialUsed: true,
                    freeTrialUsedAt: new Date(),
                    mac: mac || customer.mac,
                },
            });

            try {
                await createHotspotUser({
                    username,
                    password,
                    durationMinutes:
                        internetPackage.durationMin,
                    speedLimit:
                        internetPackage.speedLimit,
                });

                await prisma.internetSession.update({
                    where: { id: session.id },
                    data: {
                        activationStatus: "ACTIVATED",
                        activationError: null,
                    },
                });
            } catch (error: any) {
                console.error(
                    "Free trial MikroTik activation failed:",
                    error
                );

                await prisma.internetSession.update({
                    where: { id: session.id },
                    data: {
                        activationStatus: "FAILED",
                        activationError:
                            error?.message ||
                            "MikroTik activation failed",
                    },
                });
            }

            try {
                const loginLink =
                    `${portalUrl}/auto-login?sessionId=${session.id}`;

                await sendSms({
                    to: phone,
                    message:
                        `${portalName}: Your free trial is active. ` +
                        `Connect here: ${loginLink}. ` +
                        `Expires: ${formatDateTime(expiresAt)}. ` +
                        `Backup login: ${username}/${password}`,
                });
            } catch (smsError) {
                console.error("SMS failed:", smsError);
            }

            return NextResponse.json({
                ok: true,
                freeTrial: true,
                sessionId: session.id,
            });
        }

        /*
         * PAID PACKAGE
         */

        const recentPendingPayment =
            await prisma.payment.findFirst({
                where: {
                    customerId: customer.id,
                    packageId: internetPackage.id,
                    phone,
                    status: "PENDING",
                    createdAt: {
                        gte: new Date(
                            Date.now() - 2 * 60 * 1000
                        ),
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        if (
            recentPendingPayment &&
            recentPendingPayment.checkoutId
        ) {
            return NextResponse.json({
                ok: true,
                freeTrial: false,
                paymentId: recentPendingPayment.id,
                checkoutId:
                    recentPendingPayment.checkoutId,
                reused: true,
                message:
                    "An existing payment request is still being processed.",
            });
        }

        const payment = await prisma.payment.create({
            data: {
                customerId: customer.id,
                packageId: internetPackage.id,
                phone,
                amount: internetPackage.price,
                status: "PENDING",
            },
        });

        createdPaymentId = payment.id;

        let stk;

        try {
            stk = await sendStkPush({
                phone,
                amount: internetPackage.price,
                accountReference:
                    `${portalName}-${payment.id.slice(-6)}`,
                transactionDesc:
                    `${portalName} ${internetPackage.name}`,
            });
        } catch (stkError: any) {
            console.error("STK push failed:", stkError);

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "FAILED",
                },
            });

            return NextResponse.json(
                {
                    ok: false,
                    paymentId: payment.id,
                    error:
                        stkError?.message ||
                        "Unable to send the M-Pesa request.",
                },
                { status: 500 }
            );
        }

        if (!stk?.CheckoutRequestID) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "FAILED",
                },
            });

            return NextResponse.json(
                {
                    ok: false,
                    paymentId: payment.id,
                    error:
                        stk?.ResponseDescription ||
                        "M-Pesa did not accept the request.",
                },
                { status: 400 }
            );
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                checkoutId: stk.CheckoutRequestID,
            },
        });

        return NextResponse.json({
            ok: true,
            freeTrial: false,
            paymentId: payment.id,
            checkoutId: stk.CheckoutRequestID,
            message:
                "STK push sent. Enter your M-Pesa PIN.",
        });
    } catch (error: any) {
        console.error("Payment initiate error:", error);

        if (createdPaymentId) {
            try {
                await prisma.payment.update({
                    where: { id: createdPaymentId },
                    data: {
                        status: "FAILED",
                    },
                });
            } catch (updateError) {
                console.error(
                    "Could not mark payment as failed:",
                    updateError
                );
            }
        }

        return NextResponse.json(
            {
                ok: false,
                paymentId: createdPaymentId,
                error:
                    error?.message ||
                    "Payment initiation failed.",
            },
            { status: 500 }
        );
    }
}