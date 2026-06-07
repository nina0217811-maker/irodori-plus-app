'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Message = {
  id: string
  body: string
  sender_id: string
  created_at: string
  image_url?: string
}

export default function ChatPage() {
  const params = useParams()
  const applicationId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherName, setOtherName] = useState('')
  const [isFacilityUser, setIsFacilityUser] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  const newMessageRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUser()
    fetchMessages(true)

    const interval = setInterval(() => {
      fetchMessages(false)
    }, 3000)

    return () => clearInterval(interval)
  }, [applicationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/login'); return }
    setUserId(data.user.id)

    const { data: app } = await supabase.from('applications').select('nurse_id, job_id').eq('id', applicationId).single()
    if (!app) return

    const { data: job } = await supabase.from('jobs').select('facility_id').eq('id', app.job_id).single()
    const isFacility = data.user.id === job?.facility_id
    setIsFacilityUser(isFacility)

    if (isFacility) {
      const { data: np } = await supabase.from('nurse_profiles').select('name').eq('id', app.nurse_id).maybeSingle()
      setOtherName(np?.name ?? '看護師')
    } else {
      const { data: fac } = await supabase.from('facilities').select('facility_name').eq('id', job?.facility_id).maybeSingle()
      setOtherName(fac?.facility_name ?? '施設')
    }
  }

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at, image_url')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })

    if (error) console.error('fetchMessages error:', error)
    if (!error && data) setMessages(data)
    if (showLoading) setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    newMessageRef.current = e.target.value
    setNewMessage(e.target.value)
  }

  const sendMessage = async (imageUrl?: string) => {
    const body = newMessageRef.current.trim()
    if (!body && !imageUrl) return
    if (!userId) return
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    newMessageRef.current = ''
    setNewMessage('')

    const { error: insertError } = await supabase.from('messages').insert({
      application_id: applicationId,
      sender_id: userId,
      body: body || '',
      image_url: imageUrl ?? null,
    })

    if (insertError) {
      console.error('insert error:', JSON.stringify(insertError))
      alert('メッセージの送信に失敗しました: ' + insertError.message)
      setSending(false)
      sendingRef.current = false
      return
    }

    await fetch('/api/notify-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, senderId: userId, body: body || '📷 画像が送信されました' }),
    })

    setSending(false)
    sendingRef.current = false
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(path, file)

    if (uploadError) {
      console.error('upload error:', uploadError)
      alert('画像のアップロードに失敗しました: ' + uploadError.message)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(path)

    await sendMessage(urlData.publicUrl)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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
          <div style={{ fontWeight: '700', fontSize: '16px' }}>{otherName} とのチャット</div>
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
                    {isFacilityUser ? '👩‍⚕️' : '🏥'}
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  {msg.image_url ? (
                    <div>
                      <img
                        src={msg.image_url}
                        alt="送信画像"
                        style={{
                          maxWidth: '240px',
                          borderRadius: '12px',
                          display: 'block',
                          cursor: 'pointer',
                        }}
                        onClick={() => window.open(msg.image_url, '_blank')}
                      />
                      {msg.body && (
                        <div style={{
                          background: isMe ? '#E07070' : '#F1F5F9',
                          color: isMe ? '#fff' : '#1A2235',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          marginTop: '4px',
                        }}>
                          {msg.body}
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )}
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
        alignItems: 'flex-end',
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            background: '#F1F5F9',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          📷
        </button>
        <textarea
          value={newMessage}
          onChange={handleChange}
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
          onClick={() => sendMessage()}
          disabled={!newMessage.trim() || sending}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            background: newMessage.trim() && !sending ? '#E07070' : '#EDE0E0',
            border: 'none',
            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {sending ? '...' : '➤'}
        </button>
      </div>
    </div>
  )
}
