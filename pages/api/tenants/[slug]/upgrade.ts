// pages/api/tenants/[slug]/upgrade.ts
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
  if (!slug || typeof slug !== "string")
    return res.status(400).json({ error: "slug required" });

  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "ADMIN")
    return res.status(403).json({ error: "Admins only" });
  if (user.tenantSlug !== slug)
    return res.status(403).json({ error: "Forbidden" });

  const tenant = await prisma.tenant.update({
    where: { slug },
    data: { plan: "pro" },
  });
  return res.json({ success: true, plan: tenant.plan });
}
