import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStkPush } from "@/lib/mpesa";
import { createHotspotUser } from "@/lib/mikrotik";
import { sendSms } from "@/lib/sms";

const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://billing.craftinventors.co.ke";

function appRedirect(path: string) {
    return NextResponse.redirect(new URL(path, APP_URL), 303);
}

function normalizePhone(phone: string) {
    let value = phone.trim().replace(/\s+/g, "");

    if (value.startsWith("07")) value = "254" + value.substring(1);
    if (value.startsWith("+254")) value = value.substring(1);

    return value;
}

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-KE", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const packageId = String(formData.get("packageId") || "");
        const rawPhone = String(formData.get("phone") || "");
        const mac = String(formData.get("mac") || "");

        if (!packageId || !rawPhone) {
            return NextResponse.json(
                { ok: false, error: "Package and phone are required" },
                { status: 400 }
            );
        }

        const phone = normalizePhone(rawPhone);

        const settings = await prisma.appSetting.findUnique({
            where: { id: "main" },
        });

        const portalName = settings?.portalName || "CRAFT WIFI";
        const portalUrl = settings?.portalUrl || APP_URL;

        const internetPackage = await prisma.internetPackage.findUnique({
            where: { id: packageId },
        });

        if (!internetPackage) {
            return NextResponse.json(
                { ok: false, error: "Package not found" },
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
            return appRedirect("/?error=customer_blocked");
        }

        if (internetPackage.isFreeTrial) {
            if (customer.freeTrialUsed) {
                return appRedirect("/?error=free_trial_used");
            }

            if (mac) {
                const macUsed = await prisma.customer.findFirst({
                    where: {
                        mac,
                        freeTrialUsed: true,
                    },
                });

                if (macUsed) {
                    return appRedirect("/?error=free_trial_device_used");
                }
            }

            const username = phone;
            const password = String(Math.floor(1000 + Math.random() * 9000));
            const expiresAt = new Date(
                Date.now() + internetPackage.durationMin * 60 * 1000
            );

            const session = await prisma.internetSession.create({
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
                    durationMinutes: internetPackage.durationMin,
                    speedLimit: internetPackage.speedLimit,
                });

                await prisma.internetSession.update({
                    where: { id: session.id },
                    data: {
                        activationStatus: "ACTIVATED",
                        activationError: null,
                    },
                });
            } catch (error: any) {
                await prisma.internetSession.update({
                    where: { id: session.id },
                    data: {
                        activationStatus: "FAILED",
                        activationError: error?.message || "MikroTik activation failed",
                    },
                });
            }

            try {
                await sendSms({
                    to: phone,
                    message: `${portalName} free trial is active. Username: ${username}. Password: ${password}. Expires: ${formatDateTime(
                        expiresAt
                    )}. Connect to ${portalName}. Portal: ${portalUrl}`,
                });
            } catch (smsError) {
                console.error("SMS failed:", smsError);
            }

            return appRedirect(`/trial/${session.id}`);
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

        const stk = await sendStkPush({
            phone,
            amount: internetPackage.price,
            accountReference: `${portalName}-${payment.id.slice(-6)}`,
            transactionDesc: `${portalName} ${internetPackage.name}`,
        });

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                checkoutId: stk.CheckoutRequestID || null,
            },
        });

        return appRedirect(`/payment/${payment.id}?stk=sent`);
    } catch (error: any) {
        console.error("Payment initiate error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Payment initiation failed",
            },
            { status: 500 }
        );
    }
}