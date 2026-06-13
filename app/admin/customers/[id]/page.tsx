import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { toggleCustomerBlock } from "./actions";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            payments: { orderBy: { createdAt: "desc" } },
            sessions: { orderBy: { createdAt: "desc" } },
        },
    });

    if (!customer) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">{customer.phone}</h1>
                    <p className="mt-1 text-slate-300">Customer Details</p>
                </div>
                <form action={toggleCustomerBlock} className="mb-6">
                    <input type="hidden" name="customerId" value={customer.id} />
                    <input type="hidden" name="blocked" value={String(customer.blocked)} />

                    <button
                        className={`rounded-2xl cursor-pointer px-4 py-3 text-sm font-black ${customer.blocked
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-red-500 text-white"
                            }`}
                    >
                        {customer.blocked ? "Unblock Customer" : "Block Customer"}
                    </button>
                </form>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <h2 className="text-xl font-black">Sessions</h2>

                        <div className="mt-4 space-y-3">
                            {customer.sessions.map((s) => (
                                <div key={s.id} className="rounded-2xl bg-slate-100 p-4">
                                    <p><b>Username:</b> {s.username || "-"}</p>
                                    <p><b>Password:</b> {s.password || "-"}</p>
                                    <p><b>Expires:</b> {new Date(s.expiresAt).toLocaleString()}</p>
                                    <p><b>Status:</b> {s.active ? "ACTIVE" : "INACTIVE"}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <h2 className="text-xl font-black">Payments</h2>

                        <div className="mt-4 space-y-3">
                            {customer.payments.map((p) => (
                                <div key={p.id} className="rounded-2xl bg-slate-100 p-4">
                                    <p><b>Amount:</b> KES {p.amount}</p>
                                    <p><b>Status:</b> {p.status}</p>
                                    <p><b>M-Pesa:</b> {p.mpesaCode || "-"}</p>
                                    <p><b>Date:</b> {new Date(p.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
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