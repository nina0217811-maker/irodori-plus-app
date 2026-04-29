import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: '#1A2235',
      color: '#fff',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
          irodori+
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#94A3B8', fontSize: '13px', textDecoration: 'none' }}>
            プライバシーポリシー
          </Link>
          <Link href="/terms" style={{ color: '#94A3B8', fontSize: '13px', textDecoration: 'none' }}>
            利用規約
          </Link>
          <a href="mailto:info@irodori0305.jp" style={{ color: '#94A3B8', fontSize: '13px', textDecoration: 'none' }}>
            お問い合わせ
          </a>
        </div>
        <div style={{ fontSize: '12px', color: '#64748B' }}>
          © 2026 株式会社irodori. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
