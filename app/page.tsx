import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    error?: string;
    mac?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const settings = await prisma.appSetting.findUnique({
    where: { id: "main" },
  });
  const packages = await prisma.internetPackage.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  const errorMessage =
    params.error === "free_trial_used"
      ? "This phone number has already used the free trial."
      : params.error === "free_trial_device_used"
        ? "This device has already used the free trial."
        : params.error === "customer_blocked"
          ? "Your account has been blocked. Please contact support."
          : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 rounded-3xl bg-emerald-500 p-6 text-center text-slate-950">
          <h1 className="text-3xl font-black">
            {settings?.portalName || "CRAFT WIFI"}
          </h1>
          <p className="mt-2 text-sm font-medium">
            {settings?.subtitle || "Fast internet for Manguo Estate"}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-2xl bg-red-100 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <h2 className="mb-4 text-xl font-bold">Choose Package</h2>

        <div className="space-y-3">
          {packages.map((pkg) => (
            <a
              key={pkg.id}
              href={`/pay?packageId=${pkg.id}${params.mac ? `&mac=${params.mac}` : ""}`}
              className="block rounded-2xl bg-white p-5 text-slate-950 shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{pkg.name}</h3>
                  <p className="text-sm text-slate-500">
                    Speed: {pkg.speedLimit}
                  </p>
                  {pkg.isFreeTrial && (
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      One-time free trial
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black">
                    {pkg.price === 0 ? "FREE" : `KES ${pkg.price}`}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {pkg.price === 0 ? "Start trial" : "Buy now"}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by Craft Inventors
        </p>
        {settings?.whatsappPhone && (
          <a
            href={`https://wa.me/${settings.whatsappPhone.replace(/\D/g, "")}`}
            className="mt-5 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950"
          >
            Need help? Chat on WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}