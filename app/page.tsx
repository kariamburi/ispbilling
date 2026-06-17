import { prisma } from "@/lib/prisma";
import LoadingLinkButton from "./LoadingLinkButton";

type Props = {
  searchParams: Promise<{
    error?: string;
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
          : params.error === "missing_login"
            ? "Username and password are required."
            : null;

  return (
    <main className="min-h-screen bg-[#061b13] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
              Internet Portal
            </p>
            <h1 className="mt-1 text-2xl font-black">
              {settings?.portalName || "CRAFT WIFI"}
            </h1>
          </div>

          {/**  <a
            href="#login-form"
            className="cursor-pointer rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-200 transition hover:bg-white hover:text-slate-950"
          >
            Secure Login
          </a>*/}
        </header>

        {/** <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-6 text-slate-950 shadow-2xl">
          <div className="max-w-xl">
            <p className="text-sm font-black uppercase tracking-wide">
              Fast • Affordable • Reliable
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Stay connected with high-speed internet.
            </h2>

            <p className="mt-3 text-sm font-semibold text-slate-800">
              {settings?.subtitle || "Fast internet for Manguo Estate"}
            </p>
          </div>
        </section> */}

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-black">Choose Package</h2>
            <p className="mt-1 text-sm text-slate-300">
              Select a package and pay securely.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {packages.map((pkg) => (
              <LoadingLinkButton
                key={pkg.id}
                href={`/pay?packageId=${pkg.id}${params.mac ? `&mac=${params.mac}` : ""}`}
                loadingText={pkg.price === 0 ? "Starting trial..." : "Opening payment..."}
                className="group block rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98]"
              >
                <div className="flex min-h-[120px] flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{pkg.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Speed: {displaySpeed(pkg.speedLimit)}
                      </p>

                      {pkg.isFreeTrial && (
                        <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          One-time free trial
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                      <p className="text-xs font-black text-emerald-700">
                        {pkg.price === 0 ? "TRIAL" : "KES"}
                      </p>
                      <p className="text-2xl font-black">
                        {pkg.price === 0 ? "FREE" : pkg.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white transition group-hover:bg-emerald-600">
                    {pkg.price === 0 ? "Start Free Trial" : "Buy Package"}
                  </div>
                </div>
              </LoadingLinkButton>
            ))}
          </div>
        </section>

        <section
          id="login-form"
          className="mb-6 scroll-mt-6 rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-xl"
        >
          <h2 className="text-lg font-black">Already Have Access?</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Enter the username and password sent to your phone.
          </p>

          <form action="/api/hotspot/login" method="POST" className="mt-4 space-y-3">
            <input
              type="text"
              name="username"
              placeholder="Username / Phone number"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
            />

            {params.mac && <input type="hidden" name="mac" value={params.mac} />}

            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              Login to Internet
            </button>
          </form>
        </section>

        {settings?.whatsappPhone && (
          <LoadingLinkButton
            href={`https://wa.me/${settings.whatsappPhone.replace(/\D/g, "")}`}
            loadingText="Opening WhatsApp..."
            className="mb-6 block rounded-2xl border border-emerald-400/30 bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
          >
            Need help? Chat on WhatsApp
          </LoadingLinkButton>
        )}

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