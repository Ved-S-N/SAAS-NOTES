// pages/api/tenants/[slug]/invite.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { verifyToken } from "../../../../lib/auth";
import { setCors } from "../../../../lib/middleware";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });
    const token = auth.split(" ")[1];
    const payload = verifyToken(token);

    // Only Admins can invite
    if (payload.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can invite" });
    }

    const { slug } = req.query;
    if (slug !== payload.tenantSlug) {
      return res.status(403).json({ error: "Forbidden: cross-tenant invite" });
    }

    const { email, role } = req.body || {};
    if (!email || !role) {
      return res.status(400).json({ error: "email and role are required" });
    }
    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: String(slug) },
    });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Prevent duplicate user emails
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Default password for invited users (they can change later)
    const hashed = await bcrypt.hash("password", 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role,
        tenantId: tenant.id,
      },
    });

    return res.json({
      message: `User ${email} invited as ${role}`,
      userId: newUser.id,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
