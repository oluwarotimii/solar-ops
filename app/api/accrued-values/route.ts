
import { NextResponse } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { verifyToken, getUserById } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sql = getDbSql();
    const result = await sql`
      SELECT
        av.*,
        u.first_name as technician_first_name,
        u.last_name as technician_last_name,
        u.email as technician_email,
        j.title as job_title,
        jt.name as job_type_name
      FROM accrued_values av
      JOIN users u ON av.user_id = u.id
      JOIN jobs j ON av.job_id = j.id
      JOIN job_types jt ON j.job_type_id = jt.id
      ORDER BY av.created_at DESC
    `;

    const accruedValues = result.map((row: any) => {
      const value = toCamelCase(row);
      return {
        id: value.id,
        technician: {
          id: value.userId,
          name: `${value.technicianFirstName} ${value.technicianLastName}`,
          email: value.technicianEmail,
        },
        job: {
          id: value.jobId,
          title: value.jobTitle,
          type: value.jobTypeName,
        },
        sharePercentage: value.sharePercentage,
        jobValue: value.jobValue,
        earnedAmount: value.earnedAmount,
        rating: value.rating,
        month: value.month,
        year: value.year,
        createdAt: value.createdAt,
      };
    });

    return NextResponse.json(accruedValues);
  } catch (error) {
    console.error('[ACCRUED_VALUES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { userId, jobId, jobValue, sharePercentage, earnedAmount, rating, month, year } = await req.json();

    if (!userId || !jobId || !jobValue || !sharePercentage || !earnedAmount || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = getDbSql();
    const result = await sql`
      INSERT INTO accrued_values (user_id, job_id, job_value, share_percentage, earned_amount, rating, month, year)
      VALUES (${userId}, ${jobId}, ${jobValue}, ${sharePercentage}, ${earnedAmount}, ${rating || null}, ${month}, ${year})
      RETURNING *
    `;

    return NextResponse.json(toCamelCase(result[0]), { status: 201 });
  } catch (error) {
    console.error('[ACCRUED_VALUES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
