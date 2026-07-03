import { NextResponse, type NextRequest } from 'next/server';
import { z } from "zod";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

const settingsSchema = z.record(z.string(), z.string());

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'settings:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany();
    const result = settings.reduce((acc: Record<string, string>, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return NextResponse.json(result);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'settings:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", errors: parsed.error.errors }, { status: 400 });
    }
    const settings = parsed.data;

    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
