'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const fetchRole = async (userId: string) => {
    const { data: facility } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    setRole(facility ? 'facility' : 'nurse')
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        fetchRole(data.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchRole(session.user.id)
      } else {
        setUser(null)
        setRole(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setMenuOpen(false)
    router.push('/')
  }

  const nurseLinks = [
    { label: '求人を探す', href: '/jobs' },
    { label: 'マイページ', href: '/mypage' },
  ]

  const facilityLinks = [
    { label: '求人管理', href: '/dashboard' },
    { label: '求人投稿', href: '/post-job' },
  ]

  const links = role === 'nurse' ? nurseLinks : role === 'facility' ? facilityLinks : []

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #EDE0E0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '70px',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/logo.jpg" alt="irodori+" style={{ height: '68px', width: 'auto' }} />
        </Link>

        <div style={{ flex: 1 }} />

        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
            <span style={{
              fontWeight: '600',
              fontSize: '14px',
              color: pathname === l.href ? '#E07070' : '#64748B',
              borderBottom: pathname === l.href ? '2px solid #E07070' : '2px solid transparent',
              padding: '18px 4px',
              cursor: 'pointer',
            }}>{l.label}</span>
          </Link>
        ))}

        {!user ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/login">
              <button style={{
                padding: '6px 14px', background: 'none',
                border: 'none', color: '#64748B',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              }}>ログイン</button>
            </Link>
            <Link href="/register">
              <button style={{
                padding: '6px 14px', background: '#E07070',
                border: 'none', borderRadius: '8px',
                color: '#fff', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
              }}>無料登録</button>
            </Link>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: '36px', height: '36px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #C45A5A, #C0727A)',
                color: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
              }}
            >
              {role === 'nurse' ? '👩' : '🏥'}
            </div>

            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                style={{
                  position: 'absolute', right: 0, top: '44px',
                  background: '#fff', borderRadius: '10px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 32px rgba(0,0,0,0.08)',
                  border: '1px solid #EDE0E0',
                  padding: '8px', width: '180px', zIndex: 200,
                }}
              >
                <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                  {role === 'nurse' ? '👩‍⚕️ 看護師' : '🏥 施設'}
                </div>
                <div style={{ height: '1px', background: '#EDE0E0', margin: '4px 0' }} />
                {links.map(l => (
                  <div
                    key={l.href}
                    onClick={() => { router.push(l.href); setMenuOpen(false) }}
                    style={{
                      padding: '8px 12px', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '14px', color: '#1A2235',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FBF7F7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {l.label}
                  </div>
                ))}
                <div style={{ height: '1px', background: '#EDE0E0', margin: '4px 0' }} />
                <div
                  onClick={handleLogout}
                  style={{
                    padding: '8px 12px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '14px', color: '#EF4444',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  ログアウト
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}