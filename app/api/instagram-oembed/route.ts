import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const apiUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true&access_token=${appId}|${appSecret}`

  const res = await fetch(apiUrl)
  const data = await res.json()
  return NextResponse.json(data)
}
