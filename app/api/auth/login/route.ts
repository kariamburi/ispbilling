import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(req: Request) {
    const formData = await req.formData();

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const user = await prisma.adminUser.findUnique({
        where: { email },
    });

    if (!user) {
        return redirect("/login");
    }

    const valid = await bcrypt.compare(
        password,
        user.password
    );

    if (!valid) {

        return redirect("/login");
    }

    const token = await createToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    (await cookies()).set("craft_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    return redirect("/admin");
}