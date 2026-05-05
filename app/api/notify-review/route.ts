import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { nurseId, rating, comment, facilityName } = await req.json()

    const { data: { user } } = await supabase.auth.admin.getUserById(nurseId)
    if (!user?.email) return NextResponse.json({ error: 'メールアドレスが見つかりません' }, { status: 404 })

    const stars = '⭐'.repeat(rating)

    await resend.emails.send({
      from: 'irodori+ <no-reply@irodori0305.jp>',
      to: user.email,
      subject: '【irodori+】評価が届きました',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">評価が届きました</h2>
          <p>${facilityName} 様から評価が届きました。</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #F5F0FB;">
              <td style="padding: 10px; font-weight: bold;">評価</td>
              <td style="padding: 10px;">${stars} ${rating} / 5</td>
            </tr>
            ${comment ? `<tr><td style="padding: 10px; font-weight: bold;">コメント</td><td style="padding: 10px;">${comment}</td></tr>` : ''}
          </table>
          <a href="https://irodori0305.jp/mypage" style="display: inline-block; padding: 12px 24px; background: #7C3AED; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">マイページで確認する</a>
          <p style="color: #64748B; font-size: 13px; margin-top: 24px;">irodori+（いろどりプラス）</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Review notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
