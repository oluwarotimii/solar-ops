import { prisma } from "./db";

export type EarnedValueMode = "split" | "full";

export async function getEarnedValueMode(): Promise<EarnedValueMode> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: "earnedValueMode" },
  });
  return row?.value === "full" ? "full" : "split";
}

export async function calculateEarnedAmount(
  jobValue: number,
  technicianCount: number,
): Promise<number> {
  const mode = await getEarnedValueMode();

  if (mode === "full") {
    return jobValue;
  }

  if (technicianCount > 0) {
    return jobValue / technicianCount;
  }

  return 0;
}
