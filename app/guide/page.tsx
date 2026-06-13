'use client'

import { useState } from 'react'

const C = {
  primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0',
  border: '#EDE0E0', sub: '#64748B', bg: '#FBF7F7', card: '#FFFFFF', text: '#1A2235',
}

type FAQ = { q: string; a: string }

const NURSE_FAQS: FAQ[] = [
  { q: '登録は無料ですか？', a: '完全無料です。登録費・月額費・成果報酬など一切かかりません。安心してご登録ください。' },
  { q: 'どんな求人がありますか？', a: '沖縄県内の病院・クリニック・介護施設・訪問看護・デイサービスなど幅広い施設の単発求人を掲載しています。エリア・施設種別・給与帯で絞り込んで探せます。' },
  { q: '給与はいつ振り込まれますか？', a: '月末締め・翌月払いで各施設より直接お振込みいただきます。振込口座はマイページのプロフィールから登録してください。' },
  { q: 'キャンセルしたらどうなりますか？', a: '勤務24時間前までのキャンセルは無料です。12時間前以降は直前キャンセルとして記録されます。直前キャンセルが3回に達するとアカウントが停止されます。無断欠勤の場合は即アカウント停止となります。' },
  { q: '免許証の提出はなぜ必要ですか？', a: '施設が安心して採用できるよう、資格の確認を行っています。免許証を提出すると「免許証提出済み」バッジが表示され、採用率が上がります。提出した免許証は採用確定した施設の担当者のみが閲覧できます。' },
  { q: '口座情報は安全ですか？', a: '口座情報は採用確定した施設の担当者のみ閲覧できます。irodoriスタッフも閲覧しません。安全に管理しています。' },
  { q: '応募後にキャンセルできますか？', a: 'マイページの応募履歴からキャンセルできます。ただしキャンセル履歴は記録されますのでご注意ください。' },
]

const FACILITY_FAQS: FAQ[] = [
  { q: '料金はいくらですか？', a: '単発求人プランは月額¥11,000（税込）です。正社員・パート求人は初期費用¥60,000 + 月額¥20,000で、特集ページの作成とirodori公式SNSへの投稿が含まれます。' },
  { q: '求人はいつから掲載されますか？', a: '投稿後すぐに公開されます。登録看護師にLINEで即座に通知されますので、急な欠員にも対応できます。' },
  { q: '看護師の質は保証されますか？', a: '全員が看護師免許を保有しており、免許証の提出確認を行っています。過去のキャンセル履歴・施設からの評価も確認できます。直前キャンセルが多い看護師は自動的にアカウント停止となる仕組みです。' },
  { q: 'キャンセルが出たらどうなりますか？', a: '看護師がキャンセルした場合、ダッシュボードから「再募集通知」ボタンで登録看護師全員に再募集を通知できます。' },
  { q: '支払い方法は？', a: 'クレジットカード払い（Stripe）に対応しています。ダッシュボードの「プランを購入」から手続きできます。' },
  { q: '給与の支払いはどうすればいいですか？', a: '月末締め・翌月払いで各看護師へ直接お振込みください。看護師の口座情報はダッシュボードのプロフィール画面から確認できます。月次の支払い明細もPDFで出力できます。' },
  { q: 'お問い合わせはどこからできますか？', a: 'info@irodori0305.jp までメールでお問い合わせください。' },
]

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #EDE0E0' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2235', lineHeight: 1.5 }}>{faq.q}</span>
        <span style={{ fontSize: 18, color: '#E07070', flexShrink: 0, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#64748B', lineHeight: 1.8 }}>{faq.a}</div>}
    </div>
  )
}

export default function GuidePage() {
  const [tab, setTab] = useState<'nurse' | 'facility'>('nurse')
  const steps = tab === 'nurse' ? [
    { step: 1, title: '無料登録', desc: 'メールアドレスとパスワードで登録。完全無料です' },
    { step: 2, title: 'プロフィール入力', desc: '経験年数・スキル・活動エリアを入力しましょう' },
    { step: 3, title: '免許証・口座登録', desc: '免許証を提出して信頼度UP。口座情報も登録しておきましょう' },
    { step: 4, title: '求人を探して応募', desc: 'エリア・種別・給与で絞り込んでぴったりの求人を見つけましょう' },
    { step: 5, title: '採用確定・勤務', desc: '施設とチャットで詳細確認。勤務後に給与が振り込まれます' },
  ] : [
    { step: 1, title: '施設登録', desc: '施設名・種別・メールアドレスで登録' },
    { step: 2, title: 'プランを購入', desc: '月額¥11,000で単発求人を無制限に掲載できます' },
    { step: 3, title: '求人を投稿', desc: '勤務日・時間・給与を入力するだけ。投稿後すぐに看護師に通知されます' },
    { step: 4, title: '応募者を採用', desc: 'ダッシュボードで応募者のプロフィールを確認して採用しましょう' },
    { step: 5, title: '給与を振り込む', desc: '月末締め・翌月払いで看護師に直接振り込んでください' },
  ]

  return (
    <div style={{ background: '#FBF7F7', minHeight: '100vh', paddingBottom: 60, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A2235', marginBottom: 8 }}>利用ガイド・よくある質問</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>irodori+の使い方とよくあるご質問をまとめました</p>
        </div>

        <div style={{ display: 'flex', background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: 4, marginBottom: 32, gap: 4 }}>
          {[{ key: 'nurse', label: '👩‍⚕️ 看護師の方へ' }, { key: 'facility', label: '🏥 施設の方へ' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'nurse' | 'facility')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: tab === t.key ? 700 : 500, background: tab === t.key ? '#E07070' : 'none', color: tab === t.key ? '#fff' : '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE0E0', padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#1A2235' }}>{tab === 'nurse' ? '👩‍⚕️ 看護師の使い方' : '🏥 施設の使い方'}</h2>
          {steps.map((s, i) => (
            <div key={s.step} style={{ display: 'flex', gap: 16, paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E07070', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: '#EDE0E0', marginTop: 4 }} />}
              </div>
              <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2235', marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE0E0', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #EDE0E0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A2235' }}>よくある質問</h2>
          </div>
          {(tab === 'nurse' ? NURSE_FAQS : FACILITY_FAQS).map((faq, i) => <FAQItem key={i} faq={faq} />)}
        </div>

        <div style={{ background: '#FDF0F0', borderRadius: 16, border: '1px solid #EDE0E0', padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2235', marginBottom: 6 }}>解決しない場合はお問い合わせください</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>お気軽にご連絡ください</div>
          <a href="mailto:info@irodori0305.jp" style={{ display: 'inline-block', padding: '10px 24px', background: '#E07070', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            info@irodori0305.jp
          </a>
        </div>
      </div>
    </div>
  )
}
