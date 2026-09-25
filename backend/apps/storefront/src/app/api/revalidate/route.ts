import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ revalidated: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Revalidation endpoint active" });
}
