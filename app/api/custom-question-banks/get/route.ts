import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const session = await getSession({ req });
      if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = session.user.id;

      const questionBanks = await prisma.customQuestionBank.findMany({
        where: { userId },
        include: { questions: true },
      });

      res.status(200).json(questionBanks);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
