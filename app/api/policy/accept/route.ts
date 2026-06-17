import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

// Every policy a user may toggle (the profile form's policy switches). Anything
// outside this allowlist is rejected so arbitrary policyName rows can't be written.
const KNOWN_POLICIES = ["terms", "privacy", "cookie"] as const

// Policies that are mandatory to use the service (accepted via a required
// checkbox at onboarding). Withdrawing one of these revokes onboarding so the
// edge gate re-fires and the user must review + re-accept before continuing.
const MANDATORY_POLICIES: string[] = ["terms", "privacy"]

const bodySchema = z.object({
  policyName: z.enum(KNOWN_POLICIES),
  accepted: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { policyName, accepted } = parsed.data

    const userId = session.user.id
    const revokesOnboarding = !accepted && MANDATORY_POLICIES.includes(policyName)

    // Record the agreement and (for a mandatory withdrawal) revoke onboarding in
    // one transaction, so the two never drift apart.
    const policy = await prisma.$transaction(async (tx) => {
      const updated = await tx.userPolicyAgreement.upsert({
        where: { userId_policyName: { userId, policyName } },
        update: { accepted, acceptedAt: accepted ? new Date() : null },
        create: { userId, policyName, accepted, acceptedAt: accepted ? new Date() : null },
      })
      if (revokesOnboarding) {
        await tx.user.update({
          where: { id: userId },
          data: { onboardingComplete: false },
        })
      }
      return updated
    })

    await logAudit({
      userId,
      action: revokesOnboarding
        ? "ONBOARDING_REVOKED"
        : accepted
          ? "POLICY_ACCEPTED"
          : "CONSENT_WITHDRAWN",
      metadata: { policyName, accepted },
      req,
    })

    return NextResponse.json({
      message: "Policy status updated successfully",
      policy,
      requiresReonboarding: revokesOnboarding,
    })
  } catch (error) {
    console.error("Error updating policy agreement:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
