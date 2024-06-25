import { PrismaClient } from "../node_modules/.prisma/client";

declare global {
  // This must be a `var` and not a `let / const`
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
  }
} else {
  // Throw an error if prisma is being used on the client side
  throw new Error("PrismaClient is unable to be run in the browser.");
}

export default prisma;