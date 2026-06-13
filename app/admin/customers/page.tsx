import { prisma } from "@/lib/prisma";
type Props = {
    searchParams: Promise<{
        q?: string;
    }>;
};
export default async function AdminCustomersPage({ searchParams }: Props) {
    const params = await searchParams;
    const q = params.q?.trim();

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
            sessions: true,
        },
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
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

                    <button className="rounded-2xl cursor-pointer bg-emerald-500 px-4 py-3 font-black text-slate-950">
                        Search
                    </button>
                </form>
                <div className="overflow-hidden rounded-3xl bg-white shadow">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Payments</th>
                                <th className="p-4">Total Paid</th>
                                <th className="p-4">Active Sessions</th>
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
                                    (s) => s.active && new Date(s.expiresAt) > new Date()
                                );

                                return (
                                    <tr key={customer.id} className="border-t">
                                        <td className="p-4 font-bold">
                                            <a href={`/admin/customers/${customer.id}`} className="underline">
                                                {customer.phone}
                                            </a>
                                        </td>
                                        <td className="p-4">{paidPayments.length}</td>
                                        <td className="p-4">KES {totalPaid}</td>
                                        <td className="p-4">{activeSessions.length}</td>
                                        <td className="p-4">
                                            {new Date(customer.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}

                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-500">
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