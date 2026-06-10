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
  const [hamburgerOpen, setHamburgerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchRole = async (userId: string) => {
    const { data: facility } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    setRole(facility ? 'facility' : 'nurse')
    fetchUnreadCount(userId, !!facility)
  }

  const fetchUnreadCount = async (userId: string, isFacility: boolean) => {
    let apps: any[] = []
    if (isFacility) {
      const { data: jobs } = await supabase.from('jobs').select('id').eq('facility_id', userId)
      const jobIds = jobs?.map(j => j.id) ?? []
      if (jobIds.length > 0) {
        const { data } = await supabase.from('applications').select('id').in('job_id', jobIds).eq('status', 'accepted')
        apps = data ?? []
      }
    } else {
      const { data } = await supabase.from('applications').select('id').eq('nurse_id', userId).eq('status', 'accepted')
      apps = data ?? []
    }
    let count = 0
    for (const app of apps) {
      const { data: messages } = await supabase.from('messages').select('created_at, sender_id').eq('application_id', app.id).order('created_at', { ascending: false }).limit(1)
      const lastMsg = messages?.[0]
      if (!lastMsg) continue
      if (lastMsg.sender_id === userId) continue
      const storageKey = `chat_read_${app.id}`
      const lastReadAt = localStorage.getItem(storageKey) ?? ''
      if (!lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt)) count++
    }
    setUnreadCount(count)
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
        setUnreadCount(0)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && role) fetchUnreadCount(user.id, role === 'facility')
  }, [pathname])

  // ハンバーガー開いてるときは背景スクロール禁止
  useEffect(() => {
    document.body.style.overflow = hamburgerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [hamburgerOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setMenuOpen(false)
    setHamburgerOpen(false)
    setUnreadCount(0)
    router.push('/')
  }

  const nurseLinks = [
    { label: '単発求人', href: '/jobs' },
    { label: '常勤・パート', href: '/regular-jobs' },
    { label: '施設特集', href: '/features' },
    { label: 'チャット', href: '/chats', showBadge: true },
    { label: 'マイページ', href: '/mypage' },
  ]

  const facilityLinks = [
    { label: '求人管理', href: '/dashboard' },
    { label: '求人投稿', href: '/post-job' },
    { label: 'チャット', href: '/chats', showBadge: true },
  ]

  const links = role === 'nurse' ? nurseLinks : role === 'facility' ? facilityLinks : []

  return (
    <>
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

          {/* PC用リンク */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="pc-nav">
            {links.map(l => (
              <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                <span style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: pathname === l.href ? '#E07070' : '#64748B',
                  borderBottom: pathname === l.href ? '2px solid #E07070' : '2px solid transparent',
                  padding: '18px 4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {l.label === 'チャット' ? '💬 チャット' : l.label}
                  {l.showBadge && unreadCount > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '18px', height: '18px', borderRadius: '9px',
                      background: '#E07070', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '0 4px',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* ハンバーガーボタン（スマホのみ） */}
          {user && (
            <button
              onClick={() => setHamburgerOpen(o => !o)}
              className="hamburger-btn"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                flexDirection: 'column',
                gap: '5px',
                position: 'relative',
              }}
              aria-label="メニュー"
            >
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#E07070', border: '1.5px solid #fff',
                }} />
              )}
              <span style={{ display: 'block', width: '22px', height: '2px', background: hamburgerOpen ? '#E07070' : '#64748B', borderRadius: '2px', transition: 'all 0.2s', transform: hamburgerOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#64748B', borderRadius: '2px', opacity: hamburgerOpen ? 0 : 1, transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: hamburgerOpen ? '#E07070' : '#64748B', borderRadius: '2px', transition: 'all 0.2s', transform: hamburgerOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          )}

          {!user ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login">
                <button style={{ padding: '6px 14px', background: 'none', border: 'none', color: '#64748B', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>ログイン</button>
              </Link>
              <Link href="/register">
                <button style={{ padding: '6px 14px', background: '#E07070', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>無料登録</button>
              </Link>
            </div>
          ) : (
            <div style={{ position: 'relative' }} className="pc-nav">
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
                      style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#1A2235', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FBF7F7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>{l.label === 'チャット' ? '💬 チャット' : l.label}</span>
                      {l.showBadge && unreadCount > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#E07070', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '0 4px' }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
                  <div style={{ height: '1px', background: '#EDE0E0', margin: '4px 0' }} />
                  <div
                    onClick={handleLogout}
                    style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#EF4444' }}
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

      {/* スマホ用ハンバーガーメニュー */}
      {hamburgerOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setHamburgerOpen(false)}
        />
      )}
      <div style={{
        position: 'fixed', top: '70px', left: 0, right: 0,
        background: '#fff', borderBottom: '1px solid #EDE0E0',
        zIndex: 99, padding: '16px 20px',
        transform: hamburgerOpen ? 'translateY(0)' : 'translateY(-110%)',
        transition: 'transform 0.25s ease',
        display: 'none',
      }} className="hamburger-menu">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(l => (
            <div
              key={l.href}
              onClick={() => { router.push(l.href); setHamburgerOpen(false) }}
              style={{
                padding: '14px 16px', borderRadius: 10,
                background: pathname === l.href ? '#FDF0F0' : 'transparent',
                color: pathname === l.href ? '#E07070' : '#1A2235',
                fontWeight: pathname === l.href ? 700 : 500,
                fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{l.label === 'チャット' ? '💬 チャット' : l.label}</span>
              {l.showBadge && unreadCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', borderRadius: '10px', background: '#E07070', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '0 5px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          ))}
          <div style={{ height: '1px', background: '#EDE0E0', margin: '8px 0' }} />
          <div style={{ padding: '8px 16px', fontSize: 13, color: '#64748B' }}>
            {role === 'nurse' ? '👩‍⚕️ 看護師' : '🏥 施設'}
          </div>
          <div
            onClick={handleLogout}
            style={{ padding: '14px 16px', borderRadius: 10, color: '#EF4444', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
          >
            ログアウト
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pc-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .hamburger-menu { display: block !important; }
        }
      `}</style>
    </>
  )
}
