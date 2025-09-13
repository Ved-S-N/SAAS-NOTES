// lib/middleware.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "./auth";
import prisma from "./prisma";

export function setCors(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export async function getUserFromReq(req: NextApiRequest) {
  try {
    const auth = (req.headers.authorization || "") as string;
    const match = auth.match(/Bearer (.+)/);
    if (!match) return null;
    const token = match[1];
    const payload = verifyToken(token) as any;
    if (!payload?.userId) return null;

    // Re-load user from DB to ensure we have current tenant plan/slug
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      tenantPlan: user.tenant.plan,
    };
  } catch (err) {
    return null;
  }
}
