import { NextResponse } from "next/server"
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,{apiVersion:"2023-10-16"})
export async function GET(){
  try{
    const subscriptions=await stripe.subscriptions.list({status:"active",limit:100})
    return NextResponse.json({activeSubscriptions:subscriptions.data.length})
  }catch(error){
    return NextResponse.json({activeSubscriptions:0,error:"Stripe error"},{status:500})
  }
}
