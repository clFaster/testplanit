import { getEnhancedDb } from "@/lib/auth/utils";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { authOptions } from "~/server/auth";

const submitResultSchema = z.object({
  testRunId: z.number().int().positive(),
  testRunCaseId: z.number().int().positive(),
  statusId: z.number().int().positive(),
  notes: z.unknown().optional(),
  evidence: z.unknown().optional(),
  elapsed: z.number().int().nonnegative().nullable().optional(),
  attempt: z.number().int().positive(),
  testRunCaseVersion: z.number().int().positive(),
  issueIds: z.array(z.number().int().positive()).optional(),
  inProgressStateId: z.number().int().positive().nullable().optional(),
});

const ACCESS_DENIED_PATTERNS = [
  "access policy",
  "permission",
  "forbidden",
  "not authorized",
  "unauthorized",
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = submitResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: z.treeifyError(parsed.error),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const db = await getEnhancedDb(session);

    const result = await (db as any).$transaction(async (tx: any) => {
      const runCase = await tx.testRunCases.findFirst({
        where: {
          id: input.testRunCaseId,
          testRunId: input.testRunId,
        },
        select: {
          id: true,
        },
      });

      if (!runCase) {
        throw new Error("Test run case not found");
      }

      const createdResult = await tx.testRunResults.create({
        data: {
          testRunId: input.testRunId,
          testRunCaseId: input.testRunCaseId,
          statusId: input.statusId,
          notes: input.notes,
          evidence: input.evidence ?? {},
          elapsed: input.elapsed ?? null,
          executedById: session.user.id,
          attempt: input.attempt,
          testRunCaseVersion: input.testRunCaseVersion,
          issues:
            input.issueIds && input.issueIds.length > 0
              ? { connect: input.issueIds.map((id) => ({ id })) }
              : undefined,
        },
      });

      await tx.testRunCases.update({
        where: {
          id: input.testRunCaseId,
        },
        data: {
          statusId: input.statusId,
        },
      });

      if (input.inProgressStateId) {
        const previousResult = await tx.testRunResults.findFirst({
          where: {
            testRunId: input.testRunId,
            isDeleted: false,
            id: {
              not: createdResult.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (!previousResult) {
          await tx.testRuns.update({
            where: {
              id: input.testRunId,
            },
            data: {
              stateId: input.inProgressStateId,
            },
          });
        }
      }

      return createdResult;
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Test run case not found", code: "TEST_RUN_CASE_NOT_FOUND" },
          { status: 404 }
        );
      }

      if (error.code === "P2004") {
        return NextResponse.json(
          { error: "Permission denied", code: "PERMISSION_DENIED" },
          { status: 403 }
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to submit result";
    const normalizedMessage = message.toLowerCase();
    if (
      ACCESS_DENIED_PATTERNS.some((pattern) =>
        normalizedMessage.includes(pattern)
      )
    ) {
      return NextResponse.json(
        { error: "Permission denied", code: "PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    if (normalizedMessage.includes("test run case not found")) {
      return NextResponse.json(
        { error: "Test run case not found", code: "TEST_RUN_CASE_NOT_FOUND" },
        { status: 404 }
      );
    }

    console.error("Error submitting test run result:", error);
    return NextResponse.json(
      { error: "Failed to submit result", code: "SUBMIT_RESULT_FAILED" },
      { status: 500 }
    );
  }
}
