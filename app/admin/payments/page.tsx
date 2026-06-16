import { prisma } from "@/lib/prisma";
import { markPaymentPaid } from "./actions";
import { Banknote, CheckCircle2, Clock, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function money(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export default async function AdminPaymentsPage() {
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [payments, revenueToday, revenueMonth, paidCount, pendingCount, failedCount] =
    await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          customer: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: today },
        },
        _sum: { amount: true },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),

      prisma.payment.count({
        where: { status: "PAID" },
      }),

      prisma.payment.count({
        where: { status: "PENDING" },
      }),

      prisma.payment.count({
        where: { status: "FAILED" },
      }),
    ]);

  const cards = [
    {
      label: "Revenue Today",
      value: money(revenueToday._sum.amount || 0),
      icon: Banknote,
    },
    {
      label: "Month Revenue",
      value: money(revenueMonth._sum.amount || 0),
      icon: CreditCard,
    },
    {
      label: "Paid Payments",
      value: paidCount,
      icon: CheckCircle2,
    },
    {
      label: "Pending Payments",
      value: pendingCount,
      icon: Clock,
    },
    {
      label: "Failed Payments",
      value: failedCount,
      icon: CreditCard,
    },
  ];

  return (
    <main className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-black">Craft Billing</h1>
          <p className="mt-1 text-slate-300">Payments Dashboard</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-3xl bg-white p-5 shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-500">
                    {card.label}
                  </p>
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>

                <p className="mt-3 text-2xl font-black text-slate-950">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white shadow">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-4">Phone</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">M-Pesa Code</th>
                <th className="p-4">Checkout ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t align-top">
                  <td className="p-4 font-bold">
                    {payment.customerId ? (
                      <a
                        href={`/admin/customers/${payment.customerId}`}
                        className="underline"
                      >
                        {payment.phone}
                      </a>
                    ) : (
                      payment.phone
                    )}
                  </td>

                  <td className="p-4 font-bold">{money(payment.amount)}</td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${payment.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : payment.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td className="p-4">{payment.mpesaCode || "-"}</td>

                  <td className="max-w-xs break-all p-4 text-xs text-slate-500">
                    {payment.checkoutId || "-"}
                  </td>

                  <td className="p-4">
                    {new Date(payment.createdAt).toLocaleString("en-KE")}
                  </td>

                  <td className="p-4">
                    {payment.status === "PENDING" && (
                      <form action={markPaymentPaid}>
                        <input
                          type="hidden"
                          name="paymentId"
                          value={payment.id}
                        />
                        <button className="cursor-pointer rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950">
                          Mark Paid
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-3">
          <a href="/admin" className="text-sm font-bold underline">
            Dashboard
          </a>
          <a href="/admin/sessions" className="text-sm font-bold underline">
            Sessions
          </a>
        </div>
      </div>
    </main>
  );
}