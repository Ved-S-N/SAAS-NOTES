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

  if (req.method === "GET") {
    const where: any = { tenantId: user.tenantId };
    // if Member, only fetch their own notes
    if (user.role === "MEMBER") where.authorId = user.id;

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return res.json(notes);
  }

  if (req.method === "POST") {
    const { title, content } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });
    if (!tenant) return res.status(500).json({ error: "Tenant not found" });

    if (tenant.plan === "free") {
      const count = await prisma.note.count({
        where: { tenantId: user.tenantId },
      });
      if (count > 3)
        return res.status(403).json({ error: "Free plan limit reached" });
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

  return res.status(405).end();
}
