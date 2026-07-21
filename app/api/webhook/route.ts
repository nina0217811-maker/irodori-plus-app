import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const facilityId = session.metadata?.facilityId
    const subscriptionId = session.subscription as string | null

    if (facilityId) {
      await supabase
        .from('facilities')
        .update({
          plan_status: 'active',
          is_subscribed: true,
          ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
        })
        .eq('id', facilityId)
    }
  }

  // サブスク解約・失効時の処理
  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const status = subscription.status

    if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
      await supabase
        .from('facilities')
        .update({
          plan_status: 'inactive',
          is_subscribed: false,
          stripe_subscription_id: null,
        })
        .eq('stripe_subscription_id', subscription.id)
    }
  }

  return NextResponse.json({ received: true })
}
