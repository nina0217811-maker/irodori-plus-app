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
    .select()

  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ published: data?.length ?? 0, at: now })
}
