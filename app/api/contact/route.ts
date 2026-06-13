import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { facilityName, personName, email, phone, facilityType, inquiryType, message } = await req.json()

  try {
    // PDFをfetchして添付
    const pdfRes = await fetch('https://irodori0305.jp/irodori_plus_service_guide.pdf')
    const pdfBuffer = await pdfRes.arrayBuffer()

    // 施設側への自動返信（PDF添付）
    await resend.emails.send({
      from: 'irodori+ <info@irodori0305.jp>',
      to: email,
      subject: '【irodori+】お問い合わせありがとうございます',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E07070; font-size: 24px; margin: 0;">irodori+</h1>
          </div>
          <p>${personName} 様</p>
          <p>この度はirodori+へのお問い合わせありがとうございます。<br>
          以下の内容でお問い合わせを受け付けました。</p>
          <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #EDE0E0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="color: #64748B; padding: 4px 0; width: 120px;">施設名</td><td>${facilityName}</td></tr>
              <tr><td style="color: #64748B; padding: 4px 0;">担当者名</td><td>${personName}</td></tr>
              <tr><td style="color: #64748B; padding: 4px 0;">施設種別</td><td>${facilityType || '未入力'}</td></tr>
              <tr><td style="color: #64748B; padding: 4px 0;">お問い合わせ種別</td><td>${inquiryType}</td></tr>
              ${message ? `<tr><td style="color: #64748B; padding: 4px 0;">メッセージ</td><td>${message}</td></tr>` : ''}
            </table>
          </div>
          <p>サービス資料をPDFで添付しております。ご確認ください。</p>
          <p>担当者より2営業日以内にご連絡いたします。</p>
          <hr style="border: none; border-top: 1px solid #EDE0E0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94A3B8;">
            株式会社irodori<br>
            info@irodori0305.jp<br>
            https://irodori0305.jp
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'irodori+_サービス資料.pdf',
          content: Buffer.from(pdfBuffer).toString('base64'),
        },
      ],
    })

    // にいなへの通知
    await resend.emails.send({
      from: 'irodori+ <info@irodori0305.jp>',
      to: 'info@irodori0305.jp',
      subject: `【お問い合わせ】${facilityName}（${inquiryType}）`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="color: #E07070;">新しいお問い合わせが届きました</h2>
          <div style="background: #FBF7F7; border-radius: 8px; padding: 16px; border: 1px solid #EDE0E0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="color: #64748B; padding: 6px 0; width: 130px;">施設名</td><td><strong>${facilityName}</strong></td></tr>
              <tr><td style="color: #64748B; padding: 6px 0;">担当者名</td><td>${personName}</td></tr>
              <tr><td style="color: #64748B; padding: 6px 0;">メール</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="color: #64748B; padding: 6px 0;">電話番号</td><td>${phone || '未入力'}</td></tr>
              <tr><td style="color: #64748B; padding: 6px 0;">施設種別</td><td>${facilityType || '未入力'}</td></tr>
              <tr><td style="color: #64748B; padding: 6px 0;">お問い合わせ種別</td><td>${inquiryType}</td></tr>
              ${message ? `<tr><td style="color: #64748B; padding: 6px 0;">メッセージ</td><td>${message}</td></tr>` : ''}
            </table>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 })
  }
}
