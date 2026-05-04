import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { facilityEmail, facilityName, workDate, timeFrom, timeTo, nurseName } = await req.json()

    await resend.emails.send({
      from: 'irodori+ <no-reply@irodori0305.jp>',
      to: facilityEmail,
      subject: '【irodori+】新しい応募がありました',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">新しい応募がありました</h2>
          <p>${facilityName} 様</p>
          <p>以下の求人に応募がありました。</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #F5F0FB;">
              <td style="padding: 10px; font-weight: bold;">勤務日</td>
              <td style="padding: 10px;">${workDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">時間</td>
              <td style="padding: 10px;">${timeFrom}〜${timeTo}</td>
            </tr>
            <tr style="background: #F5F0FB;">
              <td style="padding: 10px; font-weight: bold;">応募者</td>
              <td style="padding: 10px;">${nurseName}</td>
            </tr>
          </table>
          <a href="https://irodori0305.jp/dashboard" 
            style="display: inline-block; padding: 12px 24px; background: #7C3AED; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
            ダッシュボードで確認する
          </a>
          <p style="color: #64748B; font-size: 13px; margin-top: 24px;">
            irodori+（いろどりプラス）
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}