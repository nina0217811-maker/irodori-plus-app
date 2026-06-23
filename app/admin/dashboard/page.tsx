"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Tab = "nurses" | "facilities" | "jobs" | "sales"

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("nurses")
  const [nurses, setNurses] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [jobStats, setJobStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      router.push("/admin")
    } else {
      fetchAll()
    }
  }, [])

  async function fetchAll() {
    setLoading(true)

    const { data: nurseData } = await supabase.from("nurse_profiles").select("id,name,is_suspended")
    const { data: facilityData } = await supabase.from("facilities").select("id,facility_name,plan_status,is_subscribed,subscription_plan")
    const { data: jobData } = await supabase.from("jobs").select("id,facility_id,status,required_count,applications(id,status)")

    setNurses(nurseData || [])
    setFacilities(facilityData || [])

    const facilityIds = [...new Set((jobData || []).map((j: any) => j.facility_id))]
    const { data: facilityNames } = await supabase
      .from("facilities")
      .select("id,facility_name")
      .in("id", facilityIds)

    const fnMap: Record<string, string> = {}
    ;(facilityNames || []).forEach((f: any) => { fnMap[f.id] = f.facility_name })

    const fm: Record<string, any> = {}
    ;(jobData || []).forEach((job: any) => {
      const fid = job.facility_id
      const fname = fnMap[fid] || fid
      if (!fm[fid]) fm[fid] = { name: fname, jobs: 0, filledJobs: 0, applications: 0 }
      fm[fid].jobs += 1
      fm[fid].applications += (job.applications || []).length

      // 定員が埋まった求人（acceptedがrequired_count以上、またはstatus=closed）
      const acceptedCount = (job.applications || []).filter((a: any) => a.status === "accepted").length
      if (acceptedCount >= (job.required_count || 1)) {
        fm[fid].filledJobs += 1
      }
    })

    setJobStats(Object.values(fm))
    setLoading(false)
  }

  const tabs = [
    { key: "nurses", label: "看護師" },
    { key: "facilities", label: "施設・課金" },
    { key: "jobs", label: "求人・貢献度" },
    { key: "sales", label: "売上" },
  ]

  const th = { textAlign: "left" as const, padding: "10px 16px", background: "#1a1a1a", color: "#888", fontSize: "12px", borderBottom: "1px solid #2a2a2a" }
  const td = { padding: "12px 16px", borderBottom: "1px solid #1f1f1f", fontSize: "14px" }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#e5e5e5", fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#a78bfa", fontWeight: "700", fontSize: "16px" }}>IRODORI+ 管理画面</span>
        <button onClick={() => router.push("/admin/features")} style={{ background: "#E07070", border: "none", borderRadius: "6px", color: "#fff", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>📰 特集管理</button>
        <button onClick={() => { sessionStorage.removeItem("admin_auth"); router.push("/admin") }} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#888", padding: "6px 14px", cursor: "pointer", fontSize: "13px" }}>ログアウト</button>
      </div>

      <div style={{ display: "flex", gap: "4px", padding: "24px 32px 0" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            style={{ background: tab === t.key ? "#a78bfa" : "#1a1a1a", border: "1px solid " + (tab === t.key ? "#a78bfa" : "#2a2a2a"), borderRadius: "8px 8px 0 0", color: tab === t.key ? "#fff" : "#888", padding: "10px 20px", cursor: "pointer", fontSize: "13px", fontWeight: tab === t.key ? "600" : "400" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>
        {loading ? (
          <div style={{ color: "#888", padding: "40px", textAlign: "center" }}>読み込み中...</div>
        ) : (
          <>
            {tab === "nurses" && (
              <div>
                <div style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>
                  登録看護師数：<span style={{ color: "#a78bfa", fontWeight: "700" }}>{nurses.length}</span> 名
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>名前</th>
                      <th style={th}>状態</th>
                      <th style={th}>停止</th>
                      <th style={th}>削除</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nurses.map((n, i) => (
                      <tr key={i}>
                        <td style={td}>{n.name || "-"}</td>
                        <td style={td}>
                          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", background: n.is_suspended ? "#FEE2E2" : "#D1FAE5", color: n.is_suspended ? "#991B1B" : "#065F46" }}>
                            {n.is_suspended ? "停止中" : "有効"}
                          </span>
                        </td>
                        <td style={td}>
                          <button onClick={async () => {
                            if (!confirm((n.is_suspended ? "停止解除" : "停止") + "しますか？")) return
                            await supabase.from("nurse_profiles").update({ is_suspended: !n.is_suspended }).eq("id", n.id)
                            fetchAll()
                          }} style={{ padding: "3px 10px", borderRadius: "6px", border: "none", background: n.is_suspended ? "#065F46" : "#991B1B", color: "#fff", fontSize: "12px", cursor: "pointer" }}>
                            {n.is_suspended ? "解除" : "停止"}
                          </button>
                        </td>
                        <td style={td}>
                          <button onClick={async () => {
                            if (!confirm("削除しますか？この操作は取り消せません")) return
                            await supabase.from("nurse_profiles").delete().eq("id", n.id)
                            await supabase.auth.admin.deleteUser(n.id)
                            fetchAll()
                          }} style={{ padding: "3px 10px", borderRadius: "6px", border: "1px solid #fca5a5", background: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>削除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "facilities" && (
              <div>
                <div style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>
                  登録施設数：<span style={{ color: "#a78bfa", fontWeight: "700" }}>{facilities.length}</span> 施設
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>施設名</th>
                      <th style={th}>課金状況</th>
                      <th style={th}>求人停止</th>
                      <th style={th}>削除</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((f, i) => (
                      <tr key={i}>
                        <td style={td}>{f.facility_name || "-"}</td>
                        <td style={td}>
                          <select
                            value={f.plan_status === 'active' ? (f.subscription_plan || 'ume') : 'none'}
                            onChange={async (e) => {
                              const val = e.target.value
                              if (val === 'none') {
                                await supabase.from('facilities').update({ plan_status: 'inactive', is_subscribed: false, subscription_plan: null }).eq('id', f.id)
                              } else {
                                await supabase.from('facilities').update({ plan_status: 'active', is_subscribed: true, subscription_plan: val }).eq('id', f.id)
                              }
                              fetchAll()
                            }}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #a78bfa', background: '#1a1a1a', color: '#a78bfa', fontSize: '12px', cursor: 'pointer' }}
                          >
                            <option value="none">未契約</option>
                            <option value="ume">ライト</option>
                            <option value="take">スタンダード</option>
                            <option value="matsu_monthly">プレミアム</option>
                          </select>
                        </td>
                        <td style={td}>
                          <button onClick={async () => {
                            if (!confirm("この施設の全求人を強制停止しますか？")) return
                            await supabase.from("jobs").update({ status: "closed" }).eq("facility_id", f.id)
                            alert("全求人を停止しました")
                          }} style={{ padding: "3px 10px", borderRadius: "6px", border: "1px solid #FCD34D", background: "none", color: "#F59E0B", fontSize: "12px", cursor: "pointer" }}>強制停止</button>
                        </td>
                        <td style={td}>
                          <button onClick={async () => {
                            if (!confirm("この施設を削除しますか？この操作は取り消せません")) return
                            await supabase.from("jobs").delete().eq("facility_id", f.id)
                            await supabase.from("facilities").delete().eq("id", f.id)
                            await supabase.auth.admin.deleteUser(f.id)
                            fetchAll()
                          }} style={{ padding: "3px 10px", borderRadius: "6px", border: "1px solid #fca5a5", background: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>削除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "jobs" && (
              <div>
                <div style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>施設ごとの求人・採用充足率</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>施設名</th>
                      <th style={th}>求人数</th>
                      <th style={th}>応募数</th>
                      <th style={th}>充足済み求人</th>
                      <th style={th}>充足率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobStats.map((s, i) => {
                      const rate = s.jobs > 0 ? Math.round((s.filledJobs / s.jobs) * 100) : 0
                      return (
                        <tr key={i}>
                          <td style={td}>{s.name}</td>
                          <td style={td}>{s.jobs}</td>
                          <td style={td}>{s.applications}</td>
                          <td style={td}>{s.filledJobs}</td>
                          <td style={td}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "4px", height: "6px" }}>
                                <div style={{ width: rate + "%", background: rate === 100 ? "#34d399" : "#a78bfa", borderRadius: "4px", height: "6px" }} />
                              </div>
                              <span style={{ color: rate === 100 ? "#34d399" : "#a78bfa", fontSize: "12px", width: "36px" }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "sales" && <SalesTab facilities={facilities} />}
          </>
        )}
      </div>
    </div>
  )
}

function SalesTab({ facilities }: { facilities: any[] }) {
  const [sales, setSales] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/sales")
      .then(r => r.json())
      .then(d => { setSales(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: "#888", padding: "40px", textAlign: "center" }}>Stripeデータ取得中...</div>

  const activeCount = sales?.activeSubscriptions ?? 0
  const mrr = activeCount * 10000

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "課金中施設", value: activeCount + " 施設", color: "#a78bfa" },
          { label: "MRR（月次売上）", value: "¥" + mrr.toLocaleString(), color: "#34d399" },
          { label: "登録施設総数", value: facilities.length + " 施設", color: "#60a5fa" },
        ].map((card, i) => (
          <div key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "20px 24px" }}>
            <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>{card.label}</div>
            <div style={{ color: card.color, fontSize: "24px", fontWeight: "700" }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ color: "#555", fontSize: "12px" }}>※ MRRは課金中施設数 × ¥10,000で算出。Stripe本番切り替え後に正確な数値が反映されます。</div>
    </div>
  )
}
