import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { nurseId, nurseName, message, jobId } = await req.json()

    const { data: authData } = await supabase.auth.admin.getUserById(nurseId)
    if (!authData?.user?.email) return NextResponse.json({ success: true })

    let jobInfo = ''
    if (jobId) {
      const { data: job } = await supabase.from('jobs').select('work_date, time_from, time_to, wage_amount, facility_id').eq('id', jobId).maybeSingle()
      if (job) {
        jobInfo = `<div style="background: #F0FDF4; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 13px; color: #065F46;">📅 ${job.work_date}　⏰ ${job.time_from}〜${job.time_to}　💰 日給¥${job.wage_amount.toLocaleString()}</div>`
      }
    }

    await resend.emails.send({
      from: 'irodori+ <no-reply@irodori0305.jp>',
      to: authData.user.email,
      subject: '【irodori+】施設からスカウトが届きました',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
          <div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0;">🎯 スカウトが届きました！</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>${nurseName} さん</p>
            <p>施設からスカウトメッセージが届いています。</p>
            <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #E07070; font-size: 14px; line-height: 1.8;">${message}</div>
            ${jobInfo}
            <a href="https://irodori0305.jp/mypage" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">マイページで確認する</a>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
