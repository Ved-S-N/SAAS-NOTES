// pages/api/notes/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getUserFromReq, setCors } from "../../../lib/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });
  if (!tenant) return res.status(500).json({ error: "Tenant not found" });

  if (req.method === "GET") {
    const where: any = { tenantId: user.tenantId };
    if (user.role === "MEMBER") where.authorId = user.id;

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ notes, tenantPlan: tenant.plan.toUpperCase() });
  }

  if (req.method === "POST") {
    const { title, content } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });

    // Always check tenant plan from DB
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });
    if (!tenant) return res.status(500).json({ error: "Tenant not found" });

    // NOTE LIMIT LOGIC (apply only to MEMBERS when plan is FREE)
    if (tenant.plan.toLowerCase() === "free" && user.role === "MEMBER") {
      const count = await prisma.note.count({
        where: { tenantId: user.tenantId, authorId: user.id },
      });
      if (count >= 3) {
        return res
          .status(403)
          .json({ error: "Free plan limit reached (3 notes per member)" });
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content || "",
        tenantId: user.tenantId,
        authorId: user.id,
      },
    });

    return res.status(201).json(note);
  }
}
