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
    const { nurseIds, facilityName, jobId, reason } = await req.json()

    const { data: job } = await supabase
      .from('jobs')
      .select('work_date, time_from, time_to')
      .eq('id', jobId)
      .single()

    for (const nurseId of nurseIds) {
      const { data: { user } } = await supabase.auth.admin.getUserById(nurseId)
      if (!user?.email) continue

      const { data: nurse } = await supabase
        .from('nurse_profiles')
        .select('name')
        .eq('id', nurseId)
        .maybeSingle()

      const nurseName = nurse?.name || 'さん'

      await resend.emails.send({
        from: 'irodori+ <no-reply@irodori0305.jp>',
        to: user.email,
        subject: '【irodori+】応募結果のご連絡',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
            <div style="background: linear-gradient(135deg, #64748B, #94A3B8); padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: #fff; margin: 0;">応募結果のご連絡</h2>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
              <p>${nurseName} さん</p>
              <p>この度は応募いただきありがとうございました。</p>
              <p>誠に恐れながら、今回はご期待に添えない結果となりました。またのご応募をお待ちしております。</p>
              ${reason ? `
              <div style="background: #FBF7F7; border-radius: 8px; padding: 14px; margin: 16px 0; border-left: 4px solid #E07070;">
                <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">不採用の理由</div>
                <div style="font-size: 14px; font-weight: 600; color: #1A2235;">${reason}</div>
              </div>
              ` : ''}
              <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #64748B; width: 120px;">施設名</td><td style="padding: 6px 0;">${facilityName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748B;">勤務日</td><td style="padding: 6px 0;">${job?.work_date ?? ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748B;">時間</td><td style="padding: 6px 0;">${job?.time_from ?? ''}〜${job?.time_to ?? ''}</td></tr>
                </table>
              </div>
              <a href="https://irodori0305.jp/jobs" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">他の求人を探す</a>
              <p style="color: #64748B; font-size: 13px; margin-top: 24px;">irodori+（いろどりプラス）</p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reject notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
