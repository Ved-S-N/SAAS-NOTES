// pages/api/notes/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getUserFromReq, setCors } from "../../../lib/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (!id || typeof id !== "string")
    return res.status(400).json({ error: "id required" });

  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.tenantId !== user.tenantId) {
    return res.status(404).json({ error: "Not found" });
  }

  // role enforcement
  if (user.role === "MEMBER" && note.authorId !== user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") return res.json(note);

  if (req.method === "PUT") {
    const { title, content } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });

    const updated = await prisma.note.update({
      where: { id },
      data: { title, content },
    });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.note.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).end();
}
