'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Message = {
  id: string
  body: string
  sender_id: string
  created_at: string
  profiles: {
    name: string
    role: string
  }
}

export default function ChatPage() {
  const { id: applicationId } = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUser()
    fetchMessages()

    const channel = supabase
      .channel(`chat-${applicationId}`)
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `application_id=eq.${applicationId}`,
      }, () => {
        fetchMessages()
      })

    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [applicationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) setUserId(data.user.id)
    else router.push('/login')
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`*, profiles (name, role)`)
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })

    if (!error && data) setMessages(data)
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return

    await supabase.from('messages').insert({
      application_id: applicationId,
      sender_id: userId,
      body: newMessage.trim(),
    })

    setNewMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '24px 20px',
      fontFamily: 'sans-serif',
      height: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid #EDE0E0',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '20px' }}
        >
          ←
        </button>
        <div>
          <div style={{ fontWeight: '700', fontSize: '16px' }}>施設とのチャット</div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>メッセージで詳細を確認しましょう</div>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: '8px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>読み込み中...</div>
        ) : messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#64748B',
            padding: '60px 20px',
            background: '#FBF7F7',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
            <div style={{ fontWeight: '600', marginBottom: '6px' }}>まだメッセージがありません</div>
            <div style={{ fontSize: '13px' }}>最初のメッセージを送ってみましょう！</div>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                gap: '8px',
                alignItems: 'flex-end',
              }}>
                {!isMe && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                    background: '#EDE0E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    {msg.profiles?.role === 'nurse' ? '👩‍⚕️' : '🏥'}
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  {!isMe && (
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px', paddingLeft: '4px' }}>
                      {msg.profiles?.name}
                    </div>
                  )}
                  <div style={{
                    background: isMe ? '#E07070' : '#F1F5F9',
                    color: isMe ? '#fff' : '#1A2235',
                    padding: '10px 14px',
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}>
                    {msg.body}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    marginTop: '3px',
                    textAlign: isMe ? 'right' : 'left',
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid #EDE0E0',
        marginTop: '8px',
      }}>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='メッセージを入力... (Enterで送信)'
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1.5px solid #EDE0E0',
            borderRadius: '24px',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'sans-serif',
            lineHeight: '1.5',
          }}
          onFocus={e => e.target.style.borderColor = '#E07070'}
          onBlur={e => e.target.style.borderColor = '#EDE0E0'}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            background: newMessage.trim() ? '#E07070' : '#EDE0E0',
            border: 'none',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}