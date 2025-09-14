import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { getUserFromReq, setCors } from "../../../../lib/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Tenant slug required" });
  }

  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "ADMIN")
    return res.status(403).json({ error: "Admins only" });

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });

  // Only upgrade their own tenant
  if (tenant.id !== user.tenantId) {
    return res.status(403).json({ error: "Cannot upgrade another tenant" });
  }

  if (tenant.plan === "pro") {
    return res.json({ message: "Already on Pro", tenant });
  }

  // Upgrade tenant plan
  const updatedTenant = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { plan: "pro" },
  });

  // Upgrade all tenant members to PRO logic (optional field on user if needed)
  // Here we don’t change roles, just make sure note limit check uses tenant plan
  // Your index.ts for notes already checks tenant.plan === 'free' for note limit

  return res.json({
    message: "Tenant upgraded to Pro! All members now have unlimited notes.",
    tenant: updatedTenant,
  });
}
