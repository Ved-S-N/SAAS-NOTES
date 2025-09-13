import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import { signToken } from "../../../lib/auth";
import { setCors } from "../../../lib/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({
    userId: user.id,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenant.slug,
  });

  return res.json({
    token,
    user: { email: user.email, role: user.role, tenantSlug: user.tenant.slug },
  });
}
