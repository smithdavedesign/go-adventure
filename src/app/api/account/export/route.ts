import { NextResponse } from "next/server";
import { auth } from "@/user/auth/auth";
import { exportUserData } from "@/user/profiles/account";

/** Download the signed-in user's data as JSON (PRD: data export). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const data = await exportUserData(session.user.id, new Date().toISOString());
  if (!data) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="travel-roamer-data.json"',
    },
  });
}
