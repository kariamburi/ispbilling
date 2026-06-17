import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LoadingLinkButton from "../LoadingLinkButton";

type Props = {
  searchParams: Promise<{
    packageId?: string;
    mac?: string;
  }>;
};

function displaySpeed(profile: string | null) {
  if (profile === "trial") return "1M/1M";
  if (profile === "daily") return "3M/3M";
  if (profile === "weekly") return "5M/5M";
  if (profile === "monthly") return "10M/10M";
  return profile || "Default";
}

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
    <main className="min-h-screen bg-[#061b13] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
              Payment Portal
            </p>
            <h1 className="mt-1 text-2xl font-black">
              {settings?.portalName || "CRAFT WIFI"}
            </h1>
          </div>

          <div className="rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-200">
            Secure
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-6 text-slate-950 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-wide">
            {pkg.isFreeTrial ? "Free Trial" : "M-Pesa Payment"}
          </p>

          <h2 className="mt-3 text-3xl font-black leading-tight">
            {pkg.isFreeTrial ? "Start your internet trial." : "Complete your payment."}
          </h2>

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Enter your phone number to continue.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                  Selected Package
                </p>
                <h2 className="mt-1 text-2xl font-black">{pkg.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Speed: {displaySpeed(pkg.speedLimit)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-right">
                <p className="text-xs font-black text-emerald-700">
                  {pkg.price === 0 ? "TRIAL" : "KES"}
                </p>
                <p className="text-2xl font-black">
                  {pkg.price === 0 ? "FREE" : pkg.price}
                </p>
              </div>
            </div>
          </div>

          {pkg.isFreeTrial && (
            <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
              Free trial can only be used once per phone number and device.
            </p>
          )}

          {!pkg.isFreeTrial && (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              You will receive an M-Pesa STK push on your phone.
            </p>
          )}

          <form action="/api/payments/initiate" method="POST" className="mt-5 space-y-4">
            <input type="hidden" name="packageId" value={pkg.id} />
            <input type="hidden" name="mac" value={params.mac || ""} />

            <div>
              <label className="text-sm font-black">
                {pkg.isFreeTrial ? "Phone Number" : "M-Pesa Phone Number"}
              </label>

              <input
                name="phone"
                type="tel"
                required
                placeholder="07XXXXXXXX"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              {pkg.isFreeTrial ? "Start Free Trial" : "Pay with M-Pesa"}
            </button>
          </form>
        </section>

        <LoadingLinkButton
          href={`/${params.mac ? `?mac=${params.mac}` : ""}`}
          loadingText="Going back..."
          className="mt-5 block rounded-2xl border border-emerald-400/30 bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
        >
          Choose another package
        </LoadingLinkButton>

        <footer className="mt-auto border-t border-white/10 pt-5 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {settings?.portalName || "CRAFT WIFI"}</p>

          <p className="mt-2">
            Powered by{" "}
            <a
              href="https://craftinventors.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-emerald-300 underline-offset-4 hover:underline"
            >
              Craft Inventors
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}