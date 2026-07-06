import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { facilityId, nurseId, jobTitle } = await req.json()

    const { data: facilityAuth } = await supabase.auth.admin.getUserById(facilityId)
    const { data: nurseProfile } = await supabase.from('nurse_profiles').select('name').eq('id', nurseId).maybeSingle()
    const { data: facility } = await supabase.from('facilities').select('facility_name').eq('id', facilityId).maybeSingle()

    if (facilityAuth?.user?.email) {
      await resend.emails.send({
        from: 'irodori+ <no-reply@irodori0305.jp>',
        to: facilityAuth.user.email,
        subject: `【irodori+】${nurseProfile?.name ?? '看護師'}さんから応募がありました`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
            <div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: #fff; margin: 0;">📩 求人に応募がありました</h2>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
              <p>${facility?.facility_name ?? '施設'} 担当者様</p>
              <p><strong>${nurseProfile?.name ?? '看護師'}</strong>さんから以下の求人に応募がありました。</p>
              <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <div style="font-size: 15px; font-weight: 700;">💼 ${jobTitle}</div>
              </div>
              <a href="https://irodori0305.jp/dashboard" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">ダッシュボードで確認する</a>
            </div>
          </div>
        `,
      })
    }

    // 看護師にも確認メール
    const { data: nurseAuth } = await supabase.auth.admin.getUserById(nurseId)
    if (nurseAuth?.user?.email) {
      await resend.emails.send({
        from: 'irodori+ <no-reply@irodori0305.jp>',
        to: nurseAuth.user.email,
        subject: `【irodori+】${jobTitle}への応募を受け付けました`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
            <div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: #fff; margin: 0;">✅ 応募を受け付けました</h2>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
              <p>${nurseProfile?.name ?? ''}さん</p>
              <p>以下の求人への応募を受け付けました。施設からの連絡をお待ちください。</p>
              <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <div style="font-size: 15px; font-weight: 700;">💼 ${jobTitle}</div>
              </div>
              <a href="https://irodori0305.jp/mypage" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">マイページで確認する</a>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
