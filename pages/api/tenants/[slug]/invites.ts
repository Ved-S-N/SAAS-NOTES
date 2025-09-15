// pages/api/tenants/[slug]/invites.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { JWTPayload, verifyToken } from "../../../../lib/auth";
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
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = auth.split(" ")[1];
    // Change #1: Use a specific type for the payload instead of 'any'
    const payload = verifyToken(token) as JWTPayload;

    // Authorization: Only Admins can invite
    if (payload.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can invite users" });
    }

    const { slug } = req.query;
    if (slug !== payload.tenantSlug) {
      return res.status(403).json({ error: "Forbidden: cross-tenant invite" });
    }

    const { email, role } = req.body || {};
    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required" });
    }
    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Find Tenant by its unique slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: String(slug) },
    });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Change #2: Add a stronger authorization check
    // Verify that the admin's tenant ID matches the tenant found by the slug
    if (tenant.id !== payload.tenantId) {
      return res.status(403).json({ error: "Forbidden: mismatched tenant" });
    }

    // Prevent creating a user that already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Change #3: Use a more specific HTTP status code
      return res
        .status(409) // 409 Conflict is better than 400 for existing resources
        .json({ error: "User with this email already exists" });
    }

    // Create the new user with a default password
    const hashedPassword = await bcrypt.hash("password", 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        tenantId: tenant.id,
      },
    });

    // Change #4: Use 201 Created for successful resource creation
    return res.status(201).json({
      message: `User ${email} invited as ${role}`,
      userId: newUser.id,
    });
  } catch (err: any) {
    console.error("Invite API Error:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.status(500).json({ error: "An internal server error occurred" });
  }
}
