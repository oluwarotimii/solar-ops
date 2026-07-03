import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import { generateOccurrences } from '@/lib/maintenance';

// This is the threshold for generating new occurrences.
// If the last occurrence is less than 90 days away, generate more.
const GENERATION_THRESHOLD_DAYS = 90;

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sql = getDbSql();

  try {
    // 2. Fetch all active templates
    const activeTemplates = await sql`
      SELECT * FROM maintenance_templates WHERE is_active = true
    `;

    let templatesProcessed = 0;

    // 3. For each template, check if it needs more occurrences
    for (const template of activeTemplates) {
      const [lastOccurrence] = await sql`
        SELECT scheduled_date 
        FROM maintenance_occurrences
        WHERE template_id = ${template.id}
        ORDER BY scheduled_date DESC
        LIMIT 1
      `;

      let shouldGenerate = false;
      if (!lastOccurrence) {
        // If there are no occurrences at all, generate them.
        shouldGenerate = true;
      } else {
        // If there are occurrences, check if the last one is within the threshold.
        const lastDate = new Date(lastOccurrence.scheduled_date);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + GENERATION_THRESHOLD_DAYS);

        if (lastDate < thresholdDate) {
          shouldGenerate = true;
        }
      }

      // 4. If needed, generate new occurrences
      if (shouldGenerate) {
        await generateOccurrences(template);
        templatesProcessed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron job completed. Processed ${activeTemplates.length} active templates. Generated new occurrences for ${templatesProcessed} templates.`,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
