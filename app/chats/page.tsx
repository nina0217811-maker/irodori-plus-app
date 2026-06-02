'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type ChatRoom = {
  application_id: string
  other_name: string
  last_message: string
  last_message_at: string
  job_work_date: string
  job_wage: number
  unread: boolean
}

const C = { primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0', bg: '#FBF7F7', card: '#FFFFFF', border: '#EDE0E0', sub: '#64748B' }

export default function ChatsPage() {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'nurse' | 'facility' | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: facility } = await supabase.from('facilities').select('id').eq('id', user.id).maybeSingle()
      const isFactility = !!facility
      setRole(isFactility ? 'facility' : 'nurse')

      let apps: any[] = []

      if (isFactility) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('facility_id', user.id)
        const jobIds = jobs?.map(j => j.id) ?? []
        if (jobIds.length > 0) {
          const { data } = await supabase
            .from('applications')
            .select('id, status, nurse_id, job_id')
            .in('job_id', jobIds)
            .eq('status', 'accepted')
          apps = data ?? []
        }
      } else {
        const { data } = await supabase
          .from('applications')
          .select('id, status, nurse_id, job_id')
          .eq('nurse_id', user.id)
          .eq('status', 'accepted')
        apps = data ?? []
      }

      if (apps.length === 0) { setLoading(false); return }

      const rooms: ChatRoom[] = []

      for (const app of apps) {
        const { data: messages } = await supabase
          .from('messages')
          .select('body, created_at')
          .eq('application_id', app.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const { data: job } = await supabase
          .from('jobs')
          .select('work_date, wage_amount, facility_id')
          .eq('id', app.job_id)
          .single()

        let otherName = ''
        if (isFactility) {
          const { data: np } = await supabase.from('nurse_profiles').select('name').eq('id', app.nurse_id).maybeSingle()
          otherName = np?.name ?? '看護師'
        } else {
          const { data: fac } = await supabase.from('facilities').select('facility_name').eq('id', job?.facility_id).maybeSingle()
          otherName = fac?.facility_name ?? '施設'
        }

        rooms.push({
          application_id: app.id,
          other_name: otherName,
          last_message: messages?.[0]?.body ?? 'メッセージなし',
          last_message_at: messages?.[0]?.created_at ?? '',
          job_work_date: job?.work_date ?? '',
          job_wage: job?.wage_amount ?? 0,
          unread: false,
        })
      }

      setChatRooms(rooms)
      setLoading(false)
    }
    init()
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>💬 チャット</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.sub }}>読み込み中...</div>
        ) : chatRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, color: C.sub }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>チャットはありません</div>
            <div style={{ fontSize: 13 }}>採用確定後にチャットが開始されます</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chatRooms.map(room => (
              <Link key={room.application_id} href={`/chat/${room.application_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.card, padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: `linear-gradient(135deg, ${C.primary}, #C0727A)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                    {room.other_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{room.other_name}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{room.last_message_at ? new Date(room.last_message_at).toLocaleDateString('ja-JP') : ''}</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.last_message.length > 40 ? room.last_message.slice(0, 40) + '...' : room.last_message}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                      📅 {room.job_work_date}　💰 ¥{room.job_wage?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
