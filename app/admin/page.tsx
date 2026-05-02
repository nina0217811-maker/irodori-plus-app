"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true")
      router.push("/admin/dashboard")
    } else {
      setError("パスワードが違います")
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#0f0f0f",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans JP', sans-serif"}}>
      <div style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:"12px",padding:"48px",width:"360px"}}>
        <div style={{marginBottom:"32px",textAlign:"center"}}>
          <div style={{color:"#a78bfa",fontSize:"13px",letterSpacing:"0.15em",marginBottom:"8px"}}>IRODORI+</div>
          <div style={{color:"#fff",fontSize:"20px",fontWeight:"600"}}>管理画面</div>
        </div>
        <input type="password" placeholder="パスワード" value={password} onChange={(e)=>setPassword(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleLogin()} style={{width:"100%",background:"#0f0f0f",border:"1px solid #2a2a2a",borderRadius:"8px",padding:"12px 16px",color:"#fff",fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"12px"}} />
        {error && <div style={{color:"#f87171",fontSize:"13px",marginBottom:"12px"}}>{error}</div>}
        <button onClick={handleLogin} style={{width:"100%",background:"#a78bfa",border:"none",borderRadius:"8px",padding:"12px",color:"#fff",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>ログイン</button>
      </div>
    </div>
  )
}
