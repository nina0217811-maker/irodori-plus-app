import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
})

const PLANS: Record<string, { price: string; mode: 'subscription' | 'payment'; label: string }> = {
  ume: {
    price: 'price_1TSeEmHSLOWxbHz4fHVfdUHh',
    mode: 'subscription',
    label: '梅プラン ¥11,000/月',
  },
  take: {
    price: 'price_1ThowJHSLOWxbHz4nPq7d3vt',
    mode: 'subscription',
    label: '竹プラン ¥29,800/月',
  },
  matsu_monthly: {
    price: 'price_1ThqD1HSLOWxbHz4476rURvZ',
    mode: 'subscription',
    label: '松プラン 月額 ¥39,800/月',
  },
  matsu_initial: {
    price: 'price_1ThoveHSLOWxbHz4xDnGeGdp',
    mode: 'payment',
    label: '松プラン 初期費用 ¥66,000',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { facilityId, facilityName, email, plan = 'ume' } = await req.json()

    const selectedPlan = PLANS[plan]
    if (!selectedPlan) {
      return NextResponse.json({ error: '無効なプランです' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: selectedPlan.mode,
      customer_email: email,
      line_items: [
        {
          price: selectedPlan.price,
          quantity: 1,
        },
      ],
      metadata: {
        facilityId,
        facilityName,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
