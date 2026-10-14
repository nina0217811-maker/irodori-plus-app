import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('features')
    .update({ published: true })
    .eq('published', false)
    .lte('publish_at', now)
    .select('id, title, line_catch')

  if (error) return NextResponse.json({ error }, { status: 500 })

  // 公開された記事にLINE通知を送る
  for (const f of data ?? []) {
    const catchCopy = f.line_catch
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/line-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🌸 沖縄の施設特集、公開しました

📰 ${f.title}

${catchCopy ? `「${catchCopy}...」

この続きは特集ページで👇` : '詳しくはこちら👇'}
https://irodori0305.jp/features/${f.id}`,
      }),
    })
  }

  return NextResponse.json({ published: data?.length ?? 0, at: now })
}
