import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
    searchParams: Promise<{
        q?: string;
    }>;
};

function money(amount: number) {
    return `KES ${amount.toLocaleString("en-KE")}`;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
    const params = await searchParams;
    const q = params.q?.trim();

    const now = new Date();

    const customers = await prisma.customer.findMany({
        where: q
            ? {
                OR: [
                    { phone: { contains: q } },
                    { name: { contains: q } },
                    { mac: { contains: q } },
                ],
            }
            : {},
        orderBy: { createdAt: "desc" },
        include: {
            payments: true,
            sessions: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Customers</h1>
                    <p className="mt-1 text-slate-300">Craft WiFi subscribers</p>
                </div>

                <form className="mb-6 flex gap-3 rounded-3xl bg-white p-4 shadow">
                    <input
                        name="q"
                        defaultValue={params.q || ""}
                        placeholder="Search phone, name or MAC"
                        className="flex-1 rounded-2xl border px-4 py-3"
                    />

                    <button className="cursor-pointer rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950">
                        Search
                    </button>
                </form>

                <div className="overflow-x-auto rounded-3xl bg-white shadow">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="p-4">Phone</th>
                                <th className="p-4">MAC</th>
                                <th className="p-4">Trial</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Payments</th>
                                <th className="p-4">Total Paid</th>
                                <th className="p-4">Active Sessions</th>
                                <th className="p-4">Last Session</th>
                                <th className="p-4">Joined</th>
                            </tr>
                        </thead>

                        <tbody>
                            {customers.map((customer) => {
                                const paidPayments = customer.payments.filter(
                                    (p) => p.status === "PAID"
                                );

                                const totalPaid = paidPayments.reduce(
                                    (sum, p) => sum + p.amount,
                                    0
                                );

                                const activeSessions = customer.sessions.filter(
                                    (s) => s.active && s.expiresAt > now
                                );

                                const lastSession = customer.sessions[0];

                                return (
                                    <tr key={customer.id} className="border-t">
                                        <td className="p-4 font-bold">
                                            <a
                                                href={`/admin/customers/${customer.id}`}
                                                className="underline"
                                            >
                                                {customer.phone}
                                            </a>
                                        </td>

                                        <td className="p-4">{customer.mac || "-"}</td>

                                        <td className="p-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${customer.freeTrialUsed
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                            >
                                                {customer.freeTrialUsed ? "USED" : "AVAILABLE"}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${customer.blocked
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                            >
                                                {customer.blocked ? "BLOCKED" : "ACTIVE"}
                                            </span>
                                        </td>

                                        <td className="p-4">{paidPayments.length}</td>
                                        <td className="p-4 font-bold">{money(totalPaid)}</td>
                                        <td className="p-4">{activeSessions.length}</td>

                                        <td className="p-4">
                                            {lastSession ? (
                                                <div>
                                                    <p className="font-bold">
                                                        {lastSession.activationStatus}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(lastSession.expiresAt).toLocaleString(
                                                            "en-KE"
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {new Date(customer.createdAt).toLocaleString("en-KE")}
                                        </td>
                                    </tr>
                                );
                            })}

                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-6 text-center text-slate-500">
                                        No customers yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <a href="/admin" className="mt-5 block text-sm font-bold underline">
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}