import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const session = await getSession({ req });
      if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, description, questions } = req.body;
      const userId = session.user.id;

      const newQuestionBank = await prisma.customQuestionBank.create({
        data: {
          name,
          description,
          userId,
          questions: {
            connect: questions.map((id: string) => ({ questionId: id })),
          },
        },
      });

      res.status(200).json(newQuestionBank);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
