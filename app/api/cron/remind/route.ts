import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: apps } = await supabase
      .from('applications')
      .select('id, nurse_id, job_id, accepted_at')
      .eq('status', 'accepted')

    if (!apps || apps.length === 0) return NextResponse.json({ success: true })

    const jobIds = apps.map((a: any) => a.job_id)
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, work_date, time_from, time_to, wage_amount, facility_id')
      .in('id', jobIds)

    if (!jobs) return NextResponse.json({ success: true })

    const facilityIds = [...new Set(jobs.map((j: any) => j.facility_id))]
    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, facility_name')
      .in('id', facilityIds)

    const jobMap: Record<string, any> = {}
    jobs.forEach((j: any) => { jobMap[j.id] = j })

    const facilityMap: Record<string, string> = {}
    facilities?.forEach((f: any) => { facilityMap[f.id] = f.facility_name })

    for (const app of apps) {
      const job = jobMap[app.job_id]
      if (!job) continue

      const workDate = job.work_date
      const facilityName = facilityMap[job.facility_id] ?? '施設'

      const acceptedDate = app.accepted_at ? new Date(app.accepted_at).toISOString().split('T')[0] : null

      if (acceptedDate === yesterdayStr) {
        const { data: facilityAuth } = await supabase.auth.admin.getUserById(job.facility_id)
        if (facilityAuth?.user?.email) {
          const { data: nurseProfile } = await supabase.from('nurse_profiles').select('name').eq('id', app.nurse_id).maybeSingle()
          await resend.emails.send({
            from: 'irodori+ <no-reply@irodori0305.jp>',
            to: facilityAuth.user.email,
            subject: `【irodori+】${nurseProfile?.name ?? '看護師'}さんの勤務準備をしましょう`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;"><div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;"><h2 style="color: #fff; margin: 0;">📋 勤務準備のご確認</h2></div><div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;"><p>${nurseProfile?.name ?? '看護師'}さんの採用が確定しました。</p><div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 16px 0;"><div>📅 勤務日：${workDate}</div><div>⏰ 時間：${job.time_from}〜${job.time_to}</div><div>💰 日給：¥${job.wage_amount.toLocaleString()}</div></div><p>持ち物・当日の流れなど、事前にチャットで共有しておきましょう！</p><a href="https://irodori0305.jp/chats" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">チャットを開く</a></div></div>`,
          })
        }
      }

      if (workDate === tomorrowStr) {
        const { data: facilityAuth } = await supabase.auth.admin.getUserById(job.facility_id)
        if (facilityAuth?.user?.email) {
          const { data: nurseProfile } = await supabase.from('nurse_profiles').select('name').eq('id', app.nurse_id).maybeSingle()
          await resend.emails.send({
            from: 'irodori+ <no-reply@irodori0305.jp>',
            to: facilityAuth.user.email,
            subject: `【irodori+】明日の勤務確認 - ${nurseProfile?.name ?? '看護師'}さん`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;"><div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;"><h2 style="color: #fff; margin: 0;">⏰ 明日の勤務確認</h2></div><div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;"><p>明日、${nurseProfile?.name ?? '看護師'}さんが勤務されます。</p><div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 16px 0;"><div>📅 勤務日：${workDate}</div><div>⏰ 時間：${job.time_from}〜${job.time_to}</div><div>💰 日給：¥${job.wage_amount.toLocaleString()}</div></div><p>不明点があればチャットでご確認ください。</p><a href="https://irodori0305.jp/chats" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">チャットを開く</a></div></div>`,
          })
        }

        const { data: nurseAuth } = await supabase.auth.admin.getUserById(app.nurse_id)
        if (nurseAuth?.user?.email) {
          await resend.emails.send({
            from: 'irodori+ <no-reply@irodori0305.jp>',
            to: nurseAuth.user.email,
            subject: `【irodori+】明日の勤務確認 - ${facilityName}`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;"><div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;"><h2 style="color: #fff; margin: 0;">⏰ 明日の勤務確認</h2></div><div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;"><p>明日の勤務のご確認です。</p><div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 16px 0;"><div>🏥 施設：${facilityName}</div><div>📅 勤務日：${workDate}</div><div>⏰ 時間：${job.time_from}〜${job.time_to}</div><div>💰 日給：¥${job.wage_amount.toLocaleString()}</div></div><p>持ち物や当日の流れなど、不明点があればチャットで確認しましょう！</p><a href="https://irodori0305.jp/chats" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">チャットを開く</a></div></div>`,
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
