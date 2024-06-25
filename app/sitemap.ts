import prisma from "@/lib/prisma";
import { User } from "next-auth";

type Sitemap = {
  url: string;
  lastModified: Date;
}[];

export default async function sitemap(): Promise<Sitemap> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
    take: 1,
  });

  return [
    {
      url: "https://aspirants.tech",
      lastModified: new Date(),
    },
    ...users.map((user: User) => ({
      url: `https://aspirants.tech/${user.id}`,
      lastModified: new Date(),
    })),
  ];
}
