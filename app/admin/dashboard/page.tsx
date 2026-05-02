"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
type Tab = "nurses"|"facilities"|"jobs"|"sales"
export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("nurses")
  const [nurses, setNurses] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [jobStats, setJobStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    if(sessionStorage.getItem("admin_auth")!=="true"){router.push("/admin")}
    else{fetchAll()}
  },[])
  async function fetchAll(){
    setLoading(true)
    const {data:nurseData}=await supabase.from("nurse_profiles").select("id,name,created_at").order("created_at",{ascending:false})
    const {data:facilityData}=await supabase.from("facilities").select("id,name,created_at,stripe_subscription_id").order("created_at",{ascending:false})
    const {data:jobData}=await supabase.from("jobs").select("id,title,created_at,facility_id,facilities(name),applications(id,status)").order("created_at",{ascending:false})
    setNurses(nurseData||[])
    setFacilities(facilityData||[])
    const fm:Record<string,any>={}
    ;(jobData||[]).forEach((job:any)=>{
      const fid=job.facility_id,fname=job.facilities?.name||fid
      if(!fm[fid])fm[fid]={name:fname,jobs:0,applications:0,hired:0}
      fm[fid].jobs+=1
      const apps=job.applications||[]
      fm[fid].applications+=apps.length
      fm[fid].hired+=apps.filter((a:any)=>a.status==="hired").length
    })
    setJobStats(Object.values(fm))
    setLoading(false)
  }
  const tabs=[{key:"nurses",label:"看護師"},{key:"facilities",label:"施設・課金"},{key:"jobs",label:"求人・貢献度"},{key:"sales",label:"売上"}]
  const th={textAlign:"left" as const,padding:"10px 16px",background:"#1a1a1a",color:"#888",fontSize:"12px",borderBottom:"1px solid #2a2a2a"}
  const td={padding:"12px 16px",borderBottom:"1px solid #1f1f1f",fontSize:"14px"}
  const fmt=(d:string)=>d?new Date(d).toLocaleDateString("ja-JP"):"-"
  return(
    <div style={{minHeight:"100vh",background:"#0f0f0f",color:"#e5e5e5",fontFamily:"'Noto Sans JP',sans-serif"}}>
      <div style={{background:"#1a1a1a",borderBottom:"1px solid #2a2a2a",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{color:"#a78bfa",fontWeight:"700",fontSize:"16px"}}>IRODORI+ 管理画面</span>
        <button onClick={()=>{sessionStorage.removeItem("admin_auth");router.push("/admin")}} style={{background:"none",border:"1px solid #2a2a2a",borderRadius:"6px",color:"#888",padding:"6px 14px",cursor:"pointer",fontSize:"13px"}}>ログアウト</button>
      </div>
      <div style={{display:"flex",gap:"4px",padding:"24px 32px 0"}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as Tab)} style={{background:tab===t.key?"#a78bfa":"#1a1a1a",border:"1px solid "+(tab===t.key?"#a78bfa":"#2a2a2a"),borderRadius:"8px 8px 0 0",color:tab===t.key?"#fff":"#888",padding:"10px 20px",cursor:"pointer",fontSize:"13px",fontWeight:tab===t.key?"600":"400"}}>{t.label}</button>
        ))}
      </div>
      <div style={{padding:"24px 32px"}}>
        {loading?<div style={{color:"#888",padding:"40px",textAlign:"center"}}>読み込み中...</div>:(
          <>
            {tab==="nurses"&&(
              <div>
                <div style={{color:"#888",fontSize:"13px",marginBottom:"16px"}}>登録看護師数：<span style={{color:"#a78bfa",fontWeight:"700"}}>{nurses.length}</span> 名</div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><th style={th}>名前</th><th style={th}>登録日</th></tr></thead>
                  <tbody>{nurses.map((n,i)=><tr key={i}><td style={td}>{n.name||"-"}</td><td style={{...td,color:"#888"}}>{fmt(n.created_at)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {tab==="facilities"&&(
              <div>
                <div style={{color:"#888",fontSize:"13px",marginBottom:"16px"}}>登録施設数：<span style={{color:"#a78bfa",fontWeight:"700"}}>{facilities.length}</span> 施設</div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><th style={th}>施設名</th><th style={th}>登録日</th><th style={th}>課金状況</th></tr></thead>
                  <tbody>{facilities.map((f,i)=><tr key={i}><td style={td}>{f.name||"-"}</td><td style={{...td,color:"#888"}}>{fmt(f.created_at)}</td><td style={td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"12px",background:f.stripe_subscription_id?"#1e1b4b":"#1f1f1f",color:f.stripe_subscription_id?"#a78bfa":"#666"}}>{f.stripe_subscription_id?"課金中":"未課金"}</span></td></tr>)}</tbody>
                </table>
              </div>
            )}
            {tab==="jobs"&&(
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={th}>施設名</th><th style={th}>求人数</th><th style={th}>応募数</th><th style={th}>採用数</th><th style={th}>採用率</th></tr></thead>
                <tbody>{jobStats.map((s,i)=>{
                  const rate=s.applications>0?Math.round((s.hired/s.applications)*100):0
                  return<tr key={i}><td style={td}>{s.name}</td><td style={td}>{s.jobs}</td><td style={td}>{s.applications}</td><td style={td}>{s.hired}</td><td style={td}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{flex:1,background:"#1a1a1a",borderRadius:"4px",height:"6px"}}><div style={{width:rate+"%",background:"#a78bfa",borderRadius:"4px",height:"6px"}}/></div><span style={{color:"#a78bfa",fontSize:"12px",width:"36px"}}>{rate}%</span></div></td></tr>
                })}</tbody>
              </table>
            )}
            {tab==="sales"&&<SalesTab facilities={facilities}/>}
          </>
        )}
      </div>
    </div>
  )
}
function SalesTab({facilities}:{facilities:any[]}){
  const [sales,setSales]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{fetch("/api/admin/sales").then(r=>r.json()).then(d=>{setSales(d);setLoading(false)}).catch(()=>setLoading(false))},[])
  if(loading)return<div style={{color:"#888",padding:"40px",textAlign:"center"}}>Stripeデータ取得中...</div>
  const activeCount=sales?.activeSubscriptions??0
  const mrr=activeCount*10000
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"32px"}}>
        {[{label:"課金中施設",value:activeCount+" 施設",color:"#a78bfa"},{label:"MRR（月次売上）",value:"¥"+mrr.toLocaleString(),color:"#34d399"},{label:"登録施設総数",value:facilities.length+" 施設",color:"#60a5fa"}].map((card,i)=>(
          <div key={i} style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:"10px",padding:"20px 24px"}}>
            <div style={{color:"#888",fontSize:"12px",marginBottom:"8px"}}>{card.label}</div>
            <div style={{color:card.color,fontSize:"24px",fontWeight:"700"}}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{color:"#555",fontSize:"12px"}}>※ MRRは課金中施設数 × ¥10,000で算出。Stripe本番切り替え後に正確な数値が反映されます。</div>
    </div>
  )
}
