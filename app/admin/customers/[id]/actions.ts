"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function toggleCustomerBlock(formData: FormData) {
    const customerId = String(formData.get("customerId"));
    const blocked = String(formData.get("blocked")) === "true";

    await prisma.customer.update({
        where: { id: customerId },
        data: {
            blocked: !blocked,
        },
    });

    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath("/admin/customers");

    redirect(`/admin/customers/${customerId}`);
}