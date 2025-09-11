import { type NextRequest, NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";
import { generateOccurrences } from "@/lib/maintenance";

// This endpoint should be called by a cron job
export async function GET(request: NextRequest) {
  try {
    const sql = getDbSql();

    // --- 1. Mark Overdue Occurrences as Missed ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueResult = await sql`
      UPDATE maintenance_occurrences
      SET status = 'missed'
      WHERE scheduled_date < ${sevenDaysAgo.toISOString().split('T')[0]}
        AND status IN ('scheduled', 'in_progress')
      RETURNING id;
    `;

    // --- 2. Generate Future Occurrences ---
    const activeTemplates = await sql`
      SELECT * FROM maintenance_templates WHERE is_active = TRUE;
    `;

    let generatedCount = 0;
    for (const template of activeTemplates) {
      const [lastOccurrence] = await sql`
        SELECT scheduled_date 
        FROM maintenance_occurrences 
        WHERE template_id = ${template.id} 
        ORDER BY scheduled_date DESC 
        LIMIT 1;
      `;

      const elevenMonthsFromNow = new Date();
      elevenMonthsFromNow.setMonth(elevenMonthsFromNow.getMonth() + 11);

      // If there are no occurrences or the last one is less than 11 months away
      if (!lastOccurrence || new Date(lastOccurrence.scheduled_date) < elevenMonthsFromNow) {
        await generateOccurrences(template);
        generatedCount++;
      }
    }

    return NextResponse.json({
      message: "Maintenance cron job completed successfully.",
      overdueCount: overdueResult.length,
      templatesProcessed: generatedCount,
    });

  } catch (error) {
    console.error("Maintenance cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
