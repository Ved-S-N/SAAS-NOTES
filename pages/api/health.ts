import { NextApiRequest, NextApiResponse } from "next";
import { setCors } from "../../lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  res.status(200).json({ status: "ok" });
}
