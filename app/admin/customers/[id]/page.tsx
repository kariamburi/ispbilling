import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { toggleCustomerBlock } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
    params: Promise<{ id: string }>;
};

function money(amount: number) {
    return `KES ${amount.toLocaleString("en-KE")}`;
}

export default async function CustomerDetailPage({ params }: Props) {
    const { id } = await params;
    const now = new Date();

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            payments: { orderBy: { createdAt: "desc" } },
            sessions: { orderBy: { createdAt: "desc" } },
        },
    });

    if (!customer) notFound();

    const paidPayments = customer.payments.filter((p) => p.status === "PAID");
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    const activeSessions = customer.sessions.filter(
        (s) => s.active && s.expiresAt > now
    );

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">{customer.phone}</h1>
                    <p className="mt-1 text-slate-300">Customer Details</p>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl bg-white p-5 shadow">
                        <p className="text-sm font-bold text-slate-500">Total Paid</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                            {money(totalPaid)}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 shadow">
                        <p className="text-sm font-bold text-slate-500">Paid Payments</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                            {paidPayments.length}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 shadow">
                        <p className="text-sm font-bold text-slate-500">Active Sessions</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                            {activeSessions.length}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 shadow">
                        <p className="text-sm font-bold text-slate-500">Free Trial</p>
                        <p
                            className={`mt-2 text-2xl font-black ${customer.freeTrialUsed ? "text-amber-600" : "text-emerald-600"
                                }`}
                        >
                            {customer.freeTrialUsed ? "USED" : "AVAILABLE"}
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-3xl bg-white p-6 shadow">
                    <h2 className="text-xl font-black text-slate-950">Customer Info</h2>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">Phone</p>
                            <p className="mt-1 font-black">{customer.phone}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">MAC Address</p>
                            <p className="mt-1 font-black">{customer.mac || "-"}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">Status</p>
                            <p
                                className={`mt-1 font-black ${customer.blocked ? "text-red-600" : "text-emerald-600"
                                    }`}
                            >
                                {customer.blocked ? "BLOCKED" : "ACTIVE"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">Joined</p>
                            <p className="mt-1 font-black">
                                {new Date(customer.createdAt).toLocaleString("en-KE")}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">Trial Used At</p>
                            <p className="mt-1 font-black">
                                {customer.freeTrialUsedAt
                                    ? new Date(customer.freeTrialUsedAt).toLocaleString("en-KE")
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    <form action={toggleCustomerBlock} className="mt-5">
                        <input type="hidden" name="customerId" value={customer.id} />
                        <input
                            type="hidden"
                            name="blocked"
                            value={String(customer.blocked)}
                        />

                        <button
                            className={`cursor-pointer rounded-2xl px-4 py-3 text-sm font-black ${customer.blocked
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-red-500 text-white"
                                }`}
                        >
                            {customer.blocked ? "Unblock Customer" : "Block Customer"}
                        </button>
                    </form>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <h2 className="text-xl font-black text-slate-950">Sessions</h2>

                        <div className="mt-4 space-y-3">
                            {customer.sessions.map((s) => {
                                const expired = s.expiresAt <= now;

                                return (
                                    <div key={s.id} className="rounded-2xl bg-slate-100 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p>
                                                    <b>Username:</b> {s.username || "-"}
                                                </p>
                                                <p>
                                                    <b>Password:</b> {s.password || "-"}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${expired
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                            >
                                                {expired ? "EXPIRED" : "ACTIVE"}
                                            </span>
                                        </div>

                                        <p className="mt-2">
                                            <b>Expires:</b>{" "}
                                            {new Date(s.expiresAt).toLocaleString("en-KE")}
                                        </p>

                                        <p>
                                            <b>Activation:</b> {s.activationStatus}
                                        </p>

                                        {s.activationError && (
                                            <p className="mt-2 text-xs font-bold text-red-600">
                                                {s.activationError}
                                            </p>
                                        )}

                                        {s.activationStatus === "ACTIVATED" && !expired && (
                                            <a
                                                href={`/auto-login?sessionId=${s.id}`}
                                                className="mt-3 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950"
                                            >
                                                Reconnect
                                            </a>
                                        )}
                                    </div>
                                );
                            })}

                            {customer.sessions.length === 0 && (
                                <p className="rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-500">
                                    No sessions yet.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <h2 className="text-xl font-black text-slate-950">Payments</h2>

                        <div className="mt-4 space-y-3">
                            {customer.payments.map((p) => (
                                <div key={p.id} className="rounded-2xl bg-slate-100 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p>
                                                <b>Amount:</b> {money(p.amount)}
                                            </p>
                                            <p>
                                                <b>Status:</b> {p.status}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-black ${p.status === "PAID"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : p.status === "FAILED"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {p.status}
                                        </span>
                                    </div>

                                    <p className="mt-2">
                                        <b>M-Pesa:</b> {p.mpesaCode || "-"}
                                    </p>

                                    <p>
                                        <b>Date:</b>{" "}
                                        {new Date(p.createdAt).toLocaleString("en-KE")}
                                    </p>
                                </div>
                            ))}

                            {customer.payments.length === 0 && (
                                <p className="rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-500">
                                    No payments yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <a href="/admin/customers" className="mt-5 block text-sm font-bold underline">
                    Back to Customers
                </a>
            </div>
        </main>
    );
}