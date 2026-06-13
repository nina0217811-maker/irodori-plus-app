import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
})

const PLANS: Record<string, { price: string; mode: 'subscription' | 'payment' }> = {
  single: {
    price: 'price_1TSeEmHSLOWxbHz4fHVfdUHh',
    mode: 'subscription',
  },
  regular_monthly: {
    price: 'price_1ThowJHSLOWxbHz4nPq7d3vt',
    mode: 'subscription',
  },
  regular_initial: {
    price: 'price_1ThoveHSLOWxbHz4xDnGeGdp',
    mode: 'payment',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { facilityId, facilityName, email, plan = 'single' } = await req.json()

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
