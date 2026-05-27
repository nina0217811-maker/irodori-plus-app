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
    const { facilityId, nurseId, jobId } = await req.json()

    const { data: { user: facilityUser } } = await supabase.auth.admin.getUserById(facilityId)
    if (!facilityUser?.email) return NextResponse.json({ error: '施設メールが見つかりません' }, { status: 404 })

    const { data: facility } = await supabase.from('facilities').select('facility_name').eq('id', facilityId).single()
    const { data: nurse } = await supabase.from('nurse_profiles').select('name, license, experience_years, areas, age, gender, skills').eq('id', nurseId).maybeSingle()
    const { data: job } = await supabase.from('jobs').select('work_date, time_from, time_to, wage_amount').eq('id', jobId).single()

    const licenseName = nurse?.license === 'rn' ? '正看護師' : '准看護師'
    const areas = (nurse?.areas ?? []).join('・')
    const skills = (nurse?.skills ?? []).join('、')

    await resend.emails.send({
      from: 'irodori+ <no-reply@irodori0305.jp>',
      to: facilityUser.email,
      subject: '【irodori+】新しい応募が届きました',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
          <div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0;">新しい応募が届きました</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>${facility?.facility_name ?? ''} 様</p>
            <p>看護師から応募がありました。ダッシュボードからご確認ください。</p>
            <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h3 style="color: #C45A5A; margin-top: 0;">【応募者情報】</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #64748B; width: 120px;">氏名</td><td style="padding: 6px 0; font-weight: 600;">${nurse?.name ?? '未設定'}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748B;">資格</td><td style="padding: 6px 0;">${licenseName}</td></tr>
                ${nurse?.age ? `<tr><td style="padding: 6px 0; color: #64748B;">年齢</td><td style="padding: 6px 0;">${nurse.age}歳</td></tr>` : ''}
                ${nurse?.gender ? `<tr><td style="padding: 6px 0; color: #64748B;">性別</td><td style="padding: 6px 0;">${nurse.gender}</td></tr>` : ''}
                ${nurse?.experience_years ? `<tr><td style="padding: 6px 0; color: #64748B;">経験年数</td><td style="padding: 6px 0;">${nurse.experience_years}年</td></tr>` : ''}
                ${areas ? `<tr><td style="padding: 6px 0; color: #64748B;">活動エリア</td><td style="padding: 6px 0;">${areas}</td></tr>` : ''}
                ${skills ? `<tr><td style="padding: 6px 0; color: #64748B;">スキル</td><td style="padding: 6px 0;">${skills}</td></tr>` : ''}
              </table>
            </div>
            ${job ? `<div style="background: #F0FDF4; border-radius: 8px; padding: 16px; margin: 20px 0;"><h3 style="color: #065F46; margin-top: 0;">【応募求人】</h3><p style="margin: 0;">📅 ${job.work_date}　⏰ ${job.time_from}〜${job.time_to}　💰 日給 ¥${job.wage_amount?.toLocaleString()}</p></div>` : ''}
            <a href="https://irodori0305.jp/dashboard" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">ダッシュボードで確認する</a>
            <p style="color: #64748B; font-size: 13px; margin-top: 24px;">irodori+（いろどりプラス）</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Application notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
