import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = {
  searchParams: Promise<{
    packageId?: string;
    mac?: string;
  }>;
};
export default async function PayPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!params.packageId) notFound();
  const settings = await prisma.appSetting.findUnique({
    where: { id: "main" },
  });
  const pkg = await prisma.internetPackage.findUnique({
    where: { id: params.packageId },
  });

  if (!pkg) notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 rounded-3xl bg-emerald-500 p-6 text-center text-slate-950">
          <h1 className="text-3xl font-black">
            {settings?.portalName || "CRAFT WIFI"}
          </h1>
          <p className="mt-2 text-sm font-medium">
            {pkg.isFreeTrial ? "Start your free trial" : "Complete payment"}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 text-slate-950">
          <h2 className="text-xl font-black">{pkg.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Speed: {pkg.speedLimit}</p>

          {pkg.isFreeTrial && (
            <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
              Free trial can only be used once per phone number and device.
            </p>
          )}

          <div className="mt-5 rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">Amount</p>
            <p className="text-3xl font-black">
              {pkg.price === 0 ? "FREE" : `KES ${pkg.price}`}
            </p>
          </div>

          <form action="/api/payments/initiate" method="POST" className="mt-5">
            <input type="hidden" name="packageId" value={pkg.id} />
            <input type="hidden" name="mac" value={params.mac || ""} />
            <label className="text-sm font-bold">
              {pkg.isFreeTrial ? "Phone Number" : "M-Pesa Phone Number"}
            </label>

            <input
              name="phone"
              required
              placeholder="07XXXXXXXX"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
            />

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950"
            >
              {pkg.isFreeTrial ? "Start Free Trial" : "Pay with M-Pesa"}
            </button>
          </form>
        </div>

        <a
          href="/"
          className="mt-5 block text-center text-sm text-slate-300 underline"
        >
          Choose another package
        </a>
      </div>
    </main>
  );
}