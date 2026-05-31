import { useState, useEffect } from "react";

const SAMPLE_TRADES = [
  { id: 1, stock: "RELIANCE", type: "BUY", entry: 2450, exit: 2580, qty: 10, date: "2024-05-01", day: "Wednesday", sector: "Energy", reason: "Breakout above resistance", emotion: "Confident" },
  { id: 2, stock: "TCS", type: "BUY", entry: 3800, exit: 3650, qty: 5, date: "2024-05-06", day: "Monday", sector: "IT", reason: "News based", emotion: "FOMO" },
  { id: 3, stock: "INFY", type: "BUY", entry: 1420, exit: 1490, qty: 15, date: "2024-05-08", day: "Wednesday", sector: "IT", reason: "Technical setup", emotion: "Calm" },
  { id: 4, stock: "HDFC", type: "BUY", entry: 1650, exit: 1590, qty: 8, date: "2024-05-13", day: "Monday", sector: "Finance", reason: "Tip from friend", emotion: "Greedy" },
  { id: 5, stock: "WIPRO", type: "BUY", entry: 480, exit: 510, qty: 20, date: "2024-05-15", day: "Wednesday", sector: "IT", reason: "Breakout", emotion: "Confident" },
  { id: 6, stock: "BAJFINANCE", type: "BUY", entry: 7200, exit: 6950, qty: 3, date: "2024-05-20", day: "Monday", sector: "Finance", reason: "News based", emotion: "FOMO" },
];

const EMOTIONS = ["Confident", "Calm", "FOMO", "Greedy", "Fearful", "Neutral"];
const SECTORS = ["IT", "Finance", "Energy", "Pharma", "Auto", "FMCG", "Metal", "Other"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function getPnL(t) { return (t.exit - t.entry) * t.qty; }

function getInsights(trades) {
  if (trades.length < 2) return [];
  const insights = [];
  const dayPnL = {};
  trades.forEach(t => {
    if (!dayPnL[t.day]) dayPnL[t.day] = { total: 0, count: 0 };
    dayPnL[t.day].total += getPnL(t);
    dayPnL[t.day].count += 1;
  });
  const worstDay = Object.entries(dayPnL).sort((a,b) => a[1].total - b[1].total)[0];
  if (worstDay && worstDay[1].total < 0)
    insights.push({ type:"warning", icon:"📅", text:`${worstDay[0]} ko consistently loss hota hai (₹${Math.abs(worstDay[1].total).toLocaleString()} total). Is din extra careful raho.` });

  const emotionPnL = {};
  trades.forEach(t => {
    if (!emotionPnL[t.emotion]) emotionPnL[t.emotion] = { total: 0, count: 0 };
    emotionPnL[t.emotion].total += getPnL(t);
    emotionPnL[t.emotion].count += 1;
  });
  Object.entries(emotionPnL).filter(([,v]) => v.total < 0).forEach(([emotion, data]) =>
    insights.push({ type:"danger", icon:"🧠", text:`"${emotion}" feel karte waqt ₹${Math.abs(data.total).toLocaleString()} loss. Emotion track karna zaroori hai!` })
  );

  const sectorPnL = {};
  trades.forEach(t => {
    if (!sectorPnL[t.sector]) sectorPnL[t.sector] = { total: 0, count: 0, wins: 0 };
    sectorPnL[t.sector].total += getPnL(t);
    sectorPnL[t.sector].count += 1;
    if (getPnL(t) > 0) sectorPnL[t.sector].wins += 1;
  });
  const best = Object.entries(sectorPnL).sort((a,b) => b[1].total - a[1].total)[0];
  if (best && best[1].total > 0)
    insights.push({ type:"success", icon:"🎯", text:`${best[0]} mein ${Math.round(best[1].wins/best[1].count*100)}% accuracy aur ₹${best[1].total.toLocaleString()} profit. Yahan focus badhaao!` });

  const winRate = Math.round(trades.filter(t=>getPnL(t)>0).length/trades.length*100);
  insights.push(winRate >= 50
    ? { type:"success", icon:"📊", text:`Win rate ${winRate}% — achha hai! Consistency banaye rakho.` }
    : { type:"warning", icon:"📊", text:`Win rate sirf ${winRate}% hai. Sirf high-confidence setups lo.` }
  );
  return insights;
}

export default function TradeMind() {
  const [trades, setTrades] = useState(SAMPLE_TRADES);
  const [tab, setTab] = useState("journal");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ stock:"", type:"BUY", entry:"", exit:"", qty:"", date:"", sector:"IT", reason:"", emotion:"Calm" });

  // Stock Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // AI Coach
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Feedback
  const [feedbacks, setFeedbacks] = useState([
    { id:1, name:"Arjun M.", rating:5, comment:"Bahut helpful tool hai, meri FOMO trades clearly dikh rahi hain!", date:"2024-05-22" },
    { id:2, name:"Priya S.", rating:4, comment:"AI coaching feature zabardast hai. Patterns dikhata hai jo khud nahi dekhte.", date:"2024-05-23" },
    { id:3, name:"Rahul T.", rating:5, comment:"Finally ek tool jo Hindi mein samjhata hai! WTF is this so good 😂", date:"2024-05-24" },
  ]);
  const [fbForm, setFbForm] = useState({ name:"", rating:5, comment:"" });
  const [fbSubmitted, setFbSubmitted] = useState(false);

  const totalPnL = trades.reduce((s,t) => s+getPnL(t), 0);
  const winRate = trades.length ? Math.round(trades.filter(t=>getPnL(t)>0).length/trades.length*100) : 0;
  const insights = getInsights(trades);
  const avgRating = feedbacks.length ? (feedbacks.reduce((s,f)=>s+f.rating,0)/feedbacks.length).toFixed(1) : "0";

  function addTrade() {
    if (!form.stock||!form.entry||!form.exit||!form.qty||!form.date) return;
    const d = new Date(form.date);
    setTrades(p => [...p, { ...form, id:Date.now(), entry:+form.entry, exit:+form.exit, qty:+form.qty, day:DAYS[d.getDay()] }]);
    setForm({ stock:"", type:"BUY", entry:"", exit:"", qty:"", date:"", sector:"IT", reason:"", emotion:"Calm" });
    setShowForm(false);
  }

  async function searchStock() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages:[{ role:"user", content:`Search for latest news, current price, and a brief analysis for stock: "${searchQuery}" (Indian NSE/BSE or global). Give a structured response in this exact JSON format only, no markdown:
{
  "name": "Full company name",
  "ticker": "TICKER",
  "exchange": "NSE/BSE/NASDAQ etc",
  "price": "current price with currency",
  "change": "+/-X.X% today",
  "sentiment": "Bullish/Bearish/Neutral",
  "summary": "2-3 line analysis in simple Hindi/English",
  "news": ["news headline 1", "news headline 2", "news headline 3"],
  "risk": "Low/Medium/High"
}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(i=>i.text||"").filter(Boolean).join("\n") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      try { setSearchResult(JSON.parse(clean)); }
      catch { setSearchResult({ name: searchQuery.toUpperCase(), ticker: searchQuery.toUpperCase(), exchange:"—", price:"—", change:"—", sentiment:"Neutral", summary: text.slice(0,200), news:[], risk:"Medium" }); }
    } catch { setSearchResult({ error: true }); }
    setSearchLoading(false);
  }

  async function getAICoach() {
    setAiLoading(true);
    setAiAdvice("");
    const summary = trades.map(t=>`${t.stock}|${t.day}|PnL:₹${getPnL(t)}|Emotion:${t.emotion}|Reason:${t.reason}`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content:`Tu ek expert trading coach hai. Mere trades ka data dekh aur 4-5 specific actionable insights do — simple Hindi mein. Patterns dhundho, mistakes batao, improvement batao.\n\nData:\n${summary}` }]
        })
      });
      const data = await res.json();
      setAiAdvice(data.content?.[0]?.text || "Error aaya, dobara try karo.");
    } catch { setAiAdvice("Network error. Please try again."); }
    setAiLoading(false);
  }

  function submitFeedback() {
    if (!fbForm.name.trim()||!fbForm.comment.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setFeedbacks(p=>[...p, { ...fbForm, id:Date.now(), date:today }]);
    setFbForm({ name:"", rating:5, comment:"" });
    setFbSubmitted(true);
    setTimeout(()=>setFbSubmitted(false), 3000);
  }

  const TABS = [
    { id:"journal", label:"📒 Journal" },
    { id:"search", label:"🔍 Stock Search" },
    { id:"insights", label:"💡 Patterns" },
    { id:"ai", label:"🤖 AI Coach" },
    { id:"feedback", label:"⭐ Feedback" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#080810", fontFamily:"'DM Mono','Courier New',monospace", color:"#e2e2da" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .card{background:#0f0f1a;border:1px solid #1c1c2e;border-radius:14px;padding:18px;transition:border-color 0.2s}
        .card:hover{border-color:#e8b800}
        .btn{padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all 0.2s}
        .btn-gold{background:#e8b800;color:#080810}
        .btn-gold:hover{background:#ffd000;transform:translateY(-1px)}
        .btn-ghost{background:transparent;color:#666;border:1px solid #252535}
        .btn-ghost:hover{border-color:#e8b800;color:#e8b800}
        .tab-btn{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-size:12px;background:transparent;color:#555;transition:all 0.2s;white-space:nowrap}
        .tab-btn.active{background:#1a1a2e;color:#e8b800}
        input,select,textarea{background:#0b0b16;border:1px solid #1c1c2e;border-radius:8px;color:#e2e2da;font-family:inherit;font-size:13px;padding:10px 14px;width:100%;outline:none;transition:border-color 0.2s}
        input:focus,select:focus,textarea:focus{border-color:#e8b800}
        select option{background:#0b0b16}
        .win{color:#4ade80}.loss{color:#f87171}
        .tag-win{background:#0a2a14;color:#4ade80;border:1px solid #14532d;padding:2px 10px;border-radius:20px;font-size:11px}
        .tag-loss{background:#2a0a0a;color:#f87171;border:1px solid #7f1d1d;padding:2px 10px;border-radius:20px;font-size:11px}
        .ins-warning{background:#160f00;border:1px solid #3d2800;border-radius:12px;padding:14px 16px;line-height:1.6}
        .ins-danger{background:#160000;border:1px solid #3d0000;border-radius:12px;padding:14px 16px;line-height:1.6}
        .ins-success{background:#001608;border:1px solid #003d14;border-radius:12px;padding:14px 16px;line-height:1.6}
        .pulse{animation:pulse 1.5s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        .star{cursor:pointer;font-size:22px;transition:transform 0.1s}
        .star:hover{transform:scale(1.2)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080810}::-webkit-scrollbar-thumb{background:#252535;border-radius:4px}
        .scroll-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .scroll-tabs::-webkit-scrollbar{display:none}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #1c1c2e", padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"20px", fontWeight:900, letterSpacing:"-0.02em" }}>
            <span style={{ color:"#e8b800" }}>TRADE</span><span style={{ color:"#e2e2da" }}>MIND</span>
          </div>
          <div style={{ fontSize:"10px", color:"#333", letterSpacing:"0.12em", marginTop:"2px" }}>AI TRADING JOURNAL • BETA</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:"#444" }}>AVG RATING</div>
            <div style={{ color:"#e8b800", fontFamily:"'Syne',sans-serif", fontWeight:700 }}>⭐ {avgRating}/5</div>
          </div>
          <button className="btn btn-gold" onClick={()=>setShowForm(true)}>+ Trade</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", padding:"16px 20px" }}>
        {[
          { label:"Total P&L", value:`${totalPnL>=0?"+":""}₹${totalPnL.toLocaleString()}`, color:totalPnL>=0?"#4ade80":"#f87171" },
          { label:"Win Rate", value:`${winRate}%`, color:winRate>=50?"#4ade80":"#f87171" },
          { label:"Trades", value:trades.length, color:"#e8b800" },
          { label:"Reviews", value:feedbacks.length, color:"#a78bfa" },
        ].map((s,i)=>(
          <div key={i} className="card" style={{ textAlign:"center", padding:"14px 10px" }}>
            <div style={{ fontSize:"10px", color:"#444", letterSpacing:"0.06em", marginBottom:"6px" }}>{s.label}</div>
            <div style={{ fontSize:"17px", fontWeight:500, color:s.color, fontFamily:"'Syne',sans-serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="scroll-tabs" style={{ padding:"0 20px", display:"flex", gap:"4px", borderBottom:"1px solid #1c1c2e", paddingBottom:"0" }}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:"18px 20px" }}>

        {/* JOURNAL */}
        {tab==="journal" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {trades.length===0 && <div style={{ textAlign:"center", color:"#333", padding:"40px" }}>Koi trade nahi. "+ Trade" se shuru karo.</div>}
            {[...trades].reverse().map(t=>{
              const pnl=getPnL(t);
              return (
                <div key={t.id} className="card" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"10px", alignItems:"center" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:800, color:"#e8b800" }}>{t.stock}</span>
                    <span className={pnl>=0?"tag-win":"tag-loss"}>{pnl>=0?"WIN":"LOSS"}</span>
                    <span style={{ fontSize:"11px", color:"#444" }}>{t.date} · {t.day}</span>
                    <span style={{ fontSize:"11px", color:"#555" }}>💭 {t.emotion} · 📂 {t.sector}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"17px", fontWeight:500, fontFamily:"'Syne',sans-serif" }} className={pnl>=0?"win":"loss"}>
                      {pnl>=0?"+":""}₹{pnl.toLocaleString()}
                    </div>
                    <div style={{ fontSize:"11px", color:"#444" }}>₹{t.entry}→₹{t.exit}×{t.qty}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STOCK SEARCH */}
        {tab==="search" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ display:"flex", gap:"10px" }}>
              <input placeholder="Stock dhundho... e.g. RELIANCE, APPLE, TCS" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchStock()} />
              <button className="btn btn-gold" onClick={searchStock} disabled={searchLoading} style={{ whiteSpace:"nowrap" }}>
                {searchLoading?"...":"Search"}
              </button>
            </div>
            <div style={{ fontSize:"11px", color:"#444" }}>Indian (NSE/BSE) + Global stocks supported · Real-time AI search</div>

            {searchLoading && (
              <div className="card" style={{ textAlign:"center", padding:"40px" }}>
                <div className="pulse" style={{ fontSize:"28px", marginBottom:"10px" }}>🔍</div>
                <div style={{ color:"#444", fontSize:"13px" }}>Live data fetch ho raha hai...</div>
              </div>
            )}

            {searchResult && !searchLoading && (
              searchResult.error ? (
                <div className="card" style={{ color:"#f87171", textAlign:"center", padding:"30px" }}>Search fail hua. Dobara try karo.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  <div className="card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"10px" }}>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:800, color:"#e8b800" }}>{searchResult.ticker}</div>
                        <div style={{ fontSize:"13px", color:"#888", marginTop:"2px" }}>{searchResult.name} · {searchResult.exchange}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"20px", fontWeight:700 }}>{searchResult.price}</div>
                        <div style={{ fontSize:"13px", color: searchResult.change?.startsWith("+")?"#4ade80":"#f87171" }}>{searchResult.change}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"10px", marginTop:"14px", flexWrap:"wrap" }}>
                      {[
                        { label:"Sentiment", value:searchResult.sentiment, color: searchResult.sentiment==="Bullish"?"#4ade80":searchResult.sentiment==="Bearish"?"#f87171":"#e8b800" },
                        { label:"Risk", value:searchResult.risk, color: searchResult.risk==="Low"?"#4ade80":searchResult.risk==="High"?"#f87171":"#e8b800" },
                      ].map((badge,i)=>(
                        <div key={i} style={{ background:"#14141f", border:"1px solid #1c1c2e", borderRadius:"8px", padding:"6px 12px" }}>
                          <span style={{ fontSize:"10px", color:"#444" }}>{badge.label}: </span>
                          <span style={{ fontSize:"12px", color:badge.color, fontWeight:500 }}>{badge.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:"14px", fontSize:"13px", color:"#aaa", lineHeight:1.7, borderTop:"1px solid #1c1c2e", paddingTop:"14px" }}>
                      {searchResult.summary}
                    </div>
                  </div>
                  {searchResult.news?.length > 0 && (
                    <div className="card">
                      <div style={{ fontSize:"11px", color:"#e8b800", letterSpacing:"0.08em", marginBottom:"12px" }}>LATEST NEWS</div>
                      {searchResult.news.map((n,i)=>(
                        <div key={i} style={{ padding:"10px 0", borderBottom: i<searchResult.news.length-1?"1px solid #1c1c2e":"none", fontSize:"13px", color:"#bbb", lineHeight:1.5 }}>
                          📰 {n}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {!searchResult && !searchLoading && (
              <div className="card" style={{ textAlign:"center", padding:"40px", color:"#333" }}>
                Koi bhi Indian ya global stock search karo — AI real-time data laayega
              </div>
            )}
          </div>
        )}

        {/* PATTERNS */}
        {tab==="insights" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ fontSize:"12px", color:"#444", marginBottom:"4px" }}>Tumhari trading history se AI ne yeh patterns dhundhe 👇</div>
            {insights.map((ins,i)=>(
              <div key={i} className={`ins-${ins.type}`}>
                <span style={{ fontSize:"18px", marginRight:"10px" }}>{ins.icon}</span>
                <span style={{ fontSize:"13px", color:"#c8c8c0" }}>{ins.text}</span>
              </div>
            ))}
            {insights.length===0 && <div style={{ color:"#333", textAlign:"center", padding:"40px" }}>Aur trades add karo better patterns ke liye.</div>}
          </div>
        )}

        {/* AI COACH */}
        {tab==="ai" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:700 }}>Personalized AI Coaching</div>
                <div style={{ fontSize:"11px", color:"#444", marginTop:"4px" }}>Tumhari actual trades analyze karke Hindi mein advice dega</div>
              </div>
              <button className="btn btn-gold" onClick={getAICoach} disabled={aiLoading}>
                {aiLoading?"Analyzing...":"🤖 Get Advice"}
              </button>
            </div>
            {aiLoading && (
              <div className="card" style={{ textAlign:"center", padding:"40px" }}>
                <div className="pulse" style={{ fontSize:"28px", marginBottom:"10px" }}>🧠</div>
                <div style={{ color:"#444", fontSize:"13px" }}>Trades analyze ho rahi hain...</div>
              </div>
            )}
            {aiAdvice && !aiLoading && (
              <div className="card">
                <div style={{ fontSize:"10px", color:"#e8b800", letterSpacing:"0.1em", marginBottom:"12px" }}>AI COACH ANALYSIS</div>
                <div style={{ lineHeight:1.8, fontSize:"13px", color:"#c0c0b8", whiteSpace:"pre-wrap" }}>{aiAdvice}</div>
              </div>
            )}
            {!aiAdvice && !aiLoading && (
              <div className="card" style={{ textAlign:"center", padding:"40px", color:"#333" }}>
                "Get Advice" dabaao — AI tumhari saari trades dekhkar personalized coaching dega
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {tab==="feedback" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {/* Summary */}
            <div className="card" style={{ display:"flex", alignItems:"center", gap:"20px" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"36px", fontWeight:900, color:"#e8b800" }}>{avgRating}</div>
                <div style={{ fontSize:"18px", marginTop:"2px" }}>{"⭐".repeat(Math.round(avgRating))}</div>
                <div style={{ fontSize:"11px", color:"#444", marginTop:"4px" }}>{feedbacks.length} reviews</div>
              </div>
              <div style={{ flex:1 }}>
                {[5,4,3,2,1].map(star=>{
                  const count = feedbacks.filter(f=>f.rating===star).length;
                  const pct = feedbacks.length ? (count/feedbacks.length*100) : 0;
                  return (
                    <div key={star} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                      <span style={{ fontSize:"11px", color:"#555", width:"12px" }}>{star}</span>
                      <div style={{ flex:1, background:"#1a1a2e", borderRadius:"4px", height:"6px", overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:"#e8b800", borderRadius:"4px", transition:"width 0.5s" }} />
                      </div>
                      <span style={{ fontSize:"11px", color:"#444", width:"20px" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Feedback */}
            <div className="card">
              <div style={{ fontSize:"11px", color:"#e8b800", letterSpacing:"0.08em", marginBottom:"14px" }}>APNA FEEDBACK DO</div>
              {fbSubmitted ? (
                <div style={{ textAlign:"center", padding:"20px", color:"#4ade80" }}>✅ Shukriya! Feedback submit ho gaya.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  <input placeholder="Tumhara naam" value={fbForm.name} onChange={e=>setFbForm(p=>({...p,name:e.target.value}))} />
                  <div>
                    <div style={{ fontSize:"11px", color:"#444", marginBottom:"8px" }}>Rating</div>
                    <div style={{ display:"flex", gap:"6px" }}>
                      {[1,2,3,4,5].map(s=>(
                        <span key={s} className="star" onClick={()=>setFbForm(p=>({...p,rating:s}))} style={{ opacity: s<=fbForm.rating?1:0.3 }}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <textarea rows={3} placeholder="Tool kaisa laga? Kya improve hona chahiye?" value={fbForm.comment} onChange={e=>setFbForm(p=>({...p,comment:e.target.value}))} />
                  <button className="btn btn-gold" onClick={submitFeedback} style={{ width:"100%", padding:"12px" }}>Submit Feedback</button>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {[...feedbacks].reverse().map(f=>(
                <div key={f.id} className="card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:700, color:"#e8b800" }}>{f.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <span style={{ fontSize:"13px" }}>{"⭐".repeat(f.rating)}</span>
                      <span style={{ fontSize:"11px", color:"#444" }}>{f.date}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:"13px", color:"#999", lineHeight:1.6 }}>{f.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Trade Modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"20px" }}>
          <div className="card" style={{ width:"100%", maxWidth:"460px", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:700 }}>New Trade</div>
              <button className="btn btn-ghost" onClick={()=>setShowForm(false)} style={{ padding:"6px 12px" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                { label:"Stock Name", key:"stock", placeholder:"e.g. RELIANCE" },
                { label:"Entry Price (₹)", key:"entry", placeholder:"e.g. 2450", type:"number" },
                { label:"Exit Price (₹)", key:"exit", placeholder:"e.g. 2580", type:"number" },
                { label:"Quantity", key:"qty", placeholder:"e.g. 10", type:"number" },
                { label:"Trade Date", key:"date", type:"date" },
              ].map(f=>(
                <div key={f.key}>
                  <div style={{ fontSize:"10px", color:"#444", marginBottom:"6px", letterSpacing:"0.06em" }}>{f.label}</div>
                  <input type={f.type||"text"} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                </div>
              ))}
              {[
                { label:"Sector", key:"sector", options:SECTORS },
                { label:"Emotion at Trade", key:"emotion", options:EMOTIONS },
              ].map(f=>(
                <div key={f.key}>
                  <div style={{ fontSize:"10px", color:"#444", marginBottom:"6px", letterSpacing:"0.06em" }}>{f.label}</div>
                  <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
                    {f.options.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <div style={{ fontSize:"10px", color:"#444", marginBottom:"6px", letterSpacing:"0.06em" }}>Trade kyun liya?</div>
                <textarea rows={2} placeholder="e.g. Breakout above resistance level..." value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} />
              </div>
              <button className="btn btn-gold" onClick={addTrade} style={{ marginTop:"4px", width:"100%", padding:"13px" }}>Add Trade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
