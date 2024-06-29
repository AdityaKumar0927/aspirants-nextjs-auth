import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession({ req });
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { questionId, completed } = req.body;

  try {
    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: { completed },
      create: { userId: session.user.id, questionId, reviewed: false, completed },
    });
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
