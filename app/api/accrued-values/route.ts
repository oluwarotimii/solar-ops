
import { NextResponse } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { verifyToken, getUserById } from '@/lib/auth';

import { authenticateApiRequest } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sql = getDbSql();
    const result = await sql`
      SELECT
        u.id as user_id,
        u.first_name as technician_first_name,
        u.last_name as technician_last_name,
        u.email as technician_email,
        SUM(av.earned_amount) as total_earned_amount
      FROM accrued_values av
      JOIN users u ON av.user_id = u.id
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY total_earned_amount DESC
    `;

    const accruedValues = result.map((row: any) => {
      const value = toCamelCase(row);
      return {
        technician: {
          id: value.userId,
          name: `${value.technicianFirstName} ${value.technicianLastName}`,
          email: value.technicianEmail,
        },
        totalEarnedAmount: value.totalEarnedAmount,
      };
    });

    const yearRangeResult = await sql`
      SELECT MIN(year) as min_year, MAX(year) as max_year FROM accrued_values
    `;
    const minYear = yearRangeResult[0]?.min_year || new Date().getFullYear();
    const maxYear = yearRangeResult[0]?.max_year || new Date().getFullYear();

    return NextResponse.json({ accruedValues, minYear, maxYear });
  } catch (error) {
    console.error('[ACCRUED_VALUES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await authenticateApiRequest(req);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { userId, jobId, rating, month, year } = await req.json();

    if (!userId || !jobId || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = getDbSql();

    // Fetch job_value from the jobs table
    const jobResult = await sql`
      SELECT job_value FROM jobs WHERE id = ${jobId}
    `;

    if (jobResult.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobValue = jobResult[0].job_value;

    // Count assigned technicians for the job
    const techniciansCountResult = await sql`
      SELECT COUNT(*) FROM job_technicians WHERE job_id = ${jobId}
    `;
    const numberOfTechnicians = parseInt(techniciansCountResult[0].count, 10);

    let earnedAmount = 0;
    if (numberOfTechnicians > 0) {
      earnedAmount = jobValue / numberOfTechnicians;
    }

    const result = await sql`
      INSERT INTO accrued_values (user_id, job_id, job_value, earned_amount, rating, month, year)
      VALUES (${userId}, ${jobId}, ${jobValue}, ${earnedAmount}, ${rating || null}, ${month}, ${year})
      RETURNING *
    `;

    return NextResponse.json(toCamelCase(result[0]), { status: 201 });
  } catch (error) {
    console.error('[ACCRUED_VALUES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
