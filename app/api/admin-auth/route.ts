import { NextRequest, NextResponse } from "next/server"
export async function POST(req: NextRequest) {
  const { password } = await req.json()
  console.log("入力パスワード:", password)
  console.log("環境変数:", process.env.ADMIN_PASSWORD)
  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}
