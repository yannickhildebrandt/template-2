import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'OpenAI API ist in dieser Umgebung nicht verfügbar' },
    { status: 501 }
  );
}
