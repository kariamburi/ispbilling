function getTimestamp() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}${second}`;
}

export async function getMpesaAccessToken() {
    const key = process.env.MPESA_CONSUMER_KEY!;
    const secret = process.env.MPESA_CONSUMER_SECRET!;

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const res = await fetch(
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.errorMessage || "Failed to get M-Pesa token");
    }

    return data.access_token as string;
}

export async function sendStkPush({
    phone,
    amount,
    accountReference,
    transactionDesc,
}: {
    phone: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
}) {
    const token = await getMpesaAccessToken();

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const callbackUrl = process.env.MPESA_CALLBACK_URL!;

    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
        "base64"
    );

    const res = await fetch(
        "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: Math.round(Number(amount)),
                PartyA: phone,
                PartyB: shortcode,
                PhoneNumber: phone,
                CallBackURL: callbackUrl,
                AccountReference: accountReference.slice(0, 12),
                TransactionDesc: transactionDesc.slice(0, 13),
            }),
        }
    );

    const text = await res.text();

    let data: any;
    try {
        data = JSON.parse(text);
    } catch {
        data = { raw: text };
    }

    console.log("STK PUSH RESPONSE:", {
        status: res.status,
        ok: res.ok,
        data,
    });

    if (!res.ok || data.ResponseCode !== "0") {
        throw new Error(
            data?.errorMessage ||
            data?.ResponseDescription ||
            data?.CustomerMessage ||
            data?.error_description ||
            data?.raw ||
            "Failed to send STK Push"
        );
    }

    return data as {
        MerchantRequestID?: string;
        CheckoutRequestID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
        CustomerMessage?: string;
    };
}