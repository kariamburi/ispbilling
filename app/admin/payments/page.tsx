import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { markPaymentPaid } from "./actions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-black">Craft Billing</h1>
          <p className="mt-1 text-slate-300">Payments Dashboard</p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-4">Phone</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">M-Pesa Code</th>
                <th className="p-4">Date</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="p-4 font-bold">{payment.phone}</td>
                  <td className="p-4">KES {payment.amount}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4">{payment.mpesaCode || "-"}</td>
                  <td className="p-4">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {payment.status === "PENDING" && (
                      <form action={markPaymentPaid}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <button className="rounded-xl cursor-pointer bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950">
                          Mark Paid
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}