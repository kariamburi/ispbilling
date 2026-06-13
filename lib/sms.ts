import { prisma } from "@/lib/prisma";

export function normalizeSmsPhone(phone: string) {
    let value = phone.trim().replace(/\s+/g, "");

    if (value.startsWith("07")) value = "254" + value.substring(1);
    if (value.startsWith("+254")) value = value.substring(1);

    return value;
}

export async function sendSms({
    to,
    message,
}: {
    to: string;
    message: string;
}) {
    const phone = normalizeSmsPhone(to);

    const log = await prisma.smsLog.create({
        data: {
            phone,
            message,
            status: "PENDING",
        },
    });

    try {
        const username = process.env.SMS_USERNAME!;
        const password = process.env.SMS_PASSWORD!;
        const from = process.env.SMS_SENDER_ID || "G_sort";
        const baseUrl =
            process.env.SMS_API_URL || "http://107.20.199.106/sms/1/text/query";

        const url = new URL(baseUrl);
        url.searchParams.set("username", username);
        url.searchParams.set("password", password);
        url.searchParams.set("from", from);
        url.searchParams.set("text", message);
        url.searchParams.set("to", phone);

        const res = await fetch(url.toString(), {
            method: "POST",
        });

        const text = await res.text();

        await prisma.smsLog.update({
            where: { id: log.id },
            data: {
                status: res.ok ? "SENT" : "FAILED",
                response: text,
                error: res.ok ? null : text,
            },
        });

        if (!res.ok) {
            throw new Error(`SMS failed: ${text}`);
        }

        return text;
    } catch (error: any) {
        await prisma.smsLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                error: error?.message || "SMS failed",
            },
        });

        throw error;
    }
}