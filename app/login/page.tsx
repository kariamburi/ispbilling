import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function createCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const answer = String(a + b);

  const secret = process.env.CAPTCHA_SECRET || "change-this-secret";

  const token = crypto
    .createHmac("sha256", secret)
    .update(answer)
    .digest("hex");

  return {
    question: `${a} + ${b}`,
    token,
  };
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  const token = (await cookies()).get("craft_token")?.value;

  if (token) {
    try {
      await verifyToken(token);
      redirect("/admin");
    } catch { }
  }

  const captcha = createCaptcha();

  return (
    <main className="min-h-screen bg-[#061b13] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
            Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-black">Craft Billing</h1>
          <p className="mt-2 text-sm font-medium text-slate-300">
            Secure hotspot billing management.
          </p>
        </div>

        <form
          action="/api/auth/login"
          method="POST"
          className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl"
        >
          <div className="mb-5 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-5 text-slate-950">
            <p className="text-sm font-black uppercase tracking-wide">
              Secure Login
            </p>
            <h2 className="mt-2 text-2xl font-black">Welcome back</h2>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Enter your admin credentials to continue.
            </p>
          </div>

          {params.error === "invalid" && (
            <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
              Invalid login details or verification answer.
            </p>
          )}

          <input type="hidden" name="captchaToken" value={captcha.token} />

          <div>
            <label className="text-sm font-black">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-black">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-black">
              Verification: What is {captcha.question}?
            </label>
            <input
              type="number"
              name="captchaAnswer"
              placeholder="Enter answer"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="mt-5 w-full cursor-pointer rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            Login to Dashboard
          </button>
        </form>

        <footer className="mt-6 text-center text-xs text-slate-400">
          <p>
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