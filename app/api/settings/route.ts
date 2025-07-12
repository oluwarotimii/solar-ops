
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiRequest } from "@/lib/api-auth";
import { getDbSql, toCamelCase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sql = getDbSql();
    const result = await sql`SELECT key, value FROM system_settings`;
    const settings = result.reduce((acc: any, row: any) => {
      acc[toCamelCase(row).key] = toCamelCase(row).value;
      return acc;
    }, {});

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[SETTINGS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !user.role?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await request.json();
    const sql = getDbSql();

    for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
        await sql`
          INSERT INTO system_settings (key, value)
          VALUES (${key}, ${String(settings[key])})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      }
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[SETTINGS_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
