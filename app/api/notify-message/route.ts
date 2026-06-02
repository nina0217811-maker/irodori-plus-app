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
    const { applicationId, senderId, body } = await req.json()

    const { data: app } = await supabase
      .from('applications')
      .select('nurse_id, job_id')
      .eq('id', applicationId)
      .single()

    if (!app) return NextResponse.json({ error: 'application not found' }, { status: 404 })

    const { data: job } = await supabase
      .from('jobs')
      .select('work_date, time_from, time_to, facility_id')
      .eq('id', app.job_id)
      .single()

    const { data: facility } = await supabase
      .from('facilities')
      .select('facility_name')
      .eq('id', job?.facility_id)
      .single()

    const { data: nurse } = await supabase
      .from('nurse_profiles')
      .select('name')
      .eq('id', app.nurse_id)
      .maybeSingle()

    const isFacility = senderId === job?.facility_id
    const recipientId = isFacility ? app.nurse_id : job?.facility_id
    const senderName = isFacility ? facility?.facility_name : nurse?.name
    const recipientName = isFacility ? nurse?.name : facility?.facility_name

    const { data: { user: recipientUser } } = await supabase.auth.admin.getUserById(recipientId!)
    if (!recipientUser?.email) return NextResponse.json({ success: true })

    await resend.emails.send({
      from: 'irodori+ <no-reply@irodori0305.jp>',
      to: recipientUser.email,
      subject: `【irodori+】${senderName}さんからメッセージが届きました`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A2235;">
          <div style="background: linear-gradient(135deg, #E07070, #C0727A); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0;">💬 新しいメッセージ</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #EDE0E0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>${recipientName} さん</p>
            <p><strong>${senderName}</strong> さんからメッセージが届きました。</p>
            <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #E07070;">
              <p style="margin: 0; font-size: 15px;">${body}</p>
            </div>
            <div style="background: #F0FDF4; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #065F46;">
              📅 ${job?.work_date}　⏰ ${job?.time_from}〜${job?.time_to}
            </div>
            <a href="https://irodori0305.jp/chats" style="display: inline-block; padding: 12px 24px; background: #E07070; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">チャットを開く</a>
            <p style="color: #64748B; font-size: 13px; margin-top: 24px;">irodori+（いろどりプラス）</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Message notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
