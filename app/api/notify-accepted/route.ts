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
    const { nurseId, jobId, facilityId } = await req.json()

    const { data: { user: nurseUser } } = await supabase.auth.admin.getUserById(nurseId)
    if (!nurseUser?.email) return NextResponse.json({ error: '看護師メールが見つかりません' }, { status: 404 })

    const { data: nurse } = await supabase.from('nurse_profiles').select('name').eq('id', nurseId).maybeSingle()
    const { data: facility } = await supabase.from('facilities').select('facility_name').eq('id', facilityId).single()
    const { data: job } = await supabase.from('jobs').select('work_date, time_from, time_to, wage_amount').eq('id', jobId).single()

    const nurseName = nurse?.name || 'さん'

    await resend.emails.send({
      from: 'irodori+ <no-reply@irodori0305.jp>',
      to: nurseUser.email,
      subject: '【irodori+】採用が確定しました🎉',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
          <div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0;">採用が確定しました🎉</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>${nurseName} さん、おめでとうございます！</p>
            <p>採用が確定しました。施設とのチャットで詳細をご確認ください。</p>

            <div style="background: #F0FDF4; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h3 style="color: #065F46; margin-top: 0;">【勤務情報】</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #64748B; width: 120px;">施設名</td><td style="padding: 6px 0; font-weight: 600;">${facility?.facility_name ?? ''}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748B;">勤務日</td><td style="padding: 6px 0;">${job?.work_date ?? ''}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748B;">時間</td><td style="padding: 6px 0;">${job?.time_from ?? ''}〜${job?.time_to ?? ''}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748B;">日給</td><td style="padding: 6px 0; font-weight: 600; color: #E07070;">¥${job?.wage_amount?.toLocaleString() ?? ''}</td></tr>
              </table>
            </div>

            <a href="https://irodori0305.jp/mypage" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">マイページでチャットを確認する</a>
            <p style="color: #64748B; font-size: 13px; margin-top: 24px;">irodori+（いろどりプラス）</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Accept notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
