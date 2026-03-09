import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine } from "recharts";

// ── RATE CARDS (price per use / per dog) ──
const DAYCARE_RATES = {
  "1-Day": 30, "1-Day(Loy)": 25, "1-Day(Add)": 25, "1-Day(Tele20)": 20, "1-Day(Tele25)": 25,
  "3-Day": 26, "3-Day(Loy)": 23, "3-Day(add)": 22.67, "3-Day(add-Loy)": 20,
  "5-Day": 27.6, "5-Day(Loy)": 23, "5-Day(Add)": 22, "5-Day(Add-Loy)": 18,
  "10-Day": 25.8, "10-Day(Loy)": 21.5, "10-Day(Add-Loy)": 18,
  "20-Day": 24, "20-Day(Loy)": 20, "20-Day(Add)": 19, "20-Day(Add-Loy)": 16,
  "1/2-Day": 20, "1/2-Day(Add)": 15,
};
const BOARDING_RATES = {
  "S": 50.95, "S(I)": 55.95, "S(Fam)": 40.95, "S(Fam-I)": 45.95,
  "M": 53.95, "M(I)": 58.95, "M(Fam)": 43.95, "M(Fam-I)": 48.95,
  "L": 56.95, "L(I)": 61.95, "L(Fam)": 46.95, "L(Fam-I)": 51.95,
  "XL": 60.95, "XL(I)": 65.95, "XL(Fam)": 50.95, "XL(Fam-I)": 55.95,
};
const GROOMING_RATES = {
  "FG($65)": 65, "FG($70)": 70, "FG($75)": 75, "FG($85)": 85, "FG($95)": 95, "FG($100)": 100, "FG($120)": 120, "FG($150)": 150,
  "PG($50)": 50, "PG($55)": 55, "PG($60)": 60, "PG($65)": 65, "PG($70)": 70, "PG($80)": 80, "PG($85)": 85, "PG($105)": 105, "PG($135)": 135,
  "B($20)": 20, "B($30)": 30, "B($35)": 35, "B($40)": 40, "B($45)": 45, "B($50)": 50, "B($60)": 60, "B($75)": 75, "B($80)": 80, "B($95)": 95, "B($100)": 100,
};
const EXTRA_RATES = {
  "NAIL($15)": 15, "NAIL($20)": 20, "TC($10)": 10, "OT($5)": 5, "OT($7)": 7, "OT($10)": 10,
  "F/T($10)": 10, "F/T($15)": 15, "F/T($20)": 20, "MED($10)": 10, "MED($12)": 12, "MED($20)": 20,
  "DS($20)": 20, "DS($30)": 30, "DMT($10)": 10, "DMT($20)": 20, "DMT($30)": 30, "DMT($40)": 40, "WHT($15)": 15,
};
const STAFF_BATH_RATES = { "B($30)": 30, "B($35)": 35, "B($40)": 40, "B($45)": 45, "B($50)": 50, "B($60)": 60, "B($75)": 75, "B($80)": 80, "B($95)": 95 };

const C = {
  navy: '#0f1b2d', dark: '#1a2744', slate: '#243352', teal: '#00d4aa', coral: '#ff6b6b',
  amber: '#ffc107', sky: '#4fc3f7', purple: '#b388ff', pink: '#f48fb1', white: '#f0f4f8',
  muted: '#8a9bb5', card: '#1e2f4a', border: '#2a3f5f', green: '#4caf50', input: '#152238',
};
const PIE_C = ['#00d4aa','#4fc3f7','#ff6b6b','#ffc107','#b388ff','#f48fb1'];
const fmt = n => '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
const fmt2 = n => '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = n => ((n||0)*100).toFixed(1)+'%';

const STORAGE_KEY = 'dgw-kpi-data';
const emptyDay = () => {
  const d = { daycare:{}, boarding:{}, grooming:{}, grXtra:{}, staffBath:{}, staffXtra:{}, labor:{pp:0,bp:0,hotel:0,reception:0,bather:0,rate:15} };
  Object.keys(DAYCARE_RATES).forEach(k => d.daycare[k]=0);
  Object.keys(BOARDING_RATES).forEach(k => d.boarding[k]=0);
  Object.keys(GROOMING_RATES).forEach(k => d.grooming[k]=0);
  Object.keys(EXTRA_RATES).forEach(k => { d.grXtra[k]=0; d.staffXtra[k]=0; });
  Object.keys(STAFF_BATH_RATES).forEach(k => d.staffBath[k]=0);
  return d;
};

const calcDayMetrics = (d) => {
  if(!d) return null;
  const dcDogs = Object.values(d.daycare).reduce((a,v)=>a+(v||0),0);
  const dcRev = Object.entries(d.daycare).reduce((a,[k,v])=>a+(v||0)*(DAYCARE_RATES[k]||0),0);
  const bdDogs = Object.values(d.boarding).reduce((a,v)=>a+(v||0),0);
  const bdRev = Object.entries(d.boarding).reduce((a,[k,v])=>a+(v||0)*(BOARDING_RATES[k]||0),0);
  const grDogs = Object.values(d.grooming).reduce((a,v)=>a+(v||0),0);
  const grRev = Object.entries(d.grooming).reduce((a,[k,v])=>a+(v||0)*(GROOMING_RATES[k]||0),0);
  const gxRev = Object.entries(d.grXtra).reduce((a,[k,v])=>a+(v||0)*(EXTRA_RATES[k]||0),0);
  const sbDogs = Object.values(d.staffBath).reduce((a,v)=>a+(v||0),0);
  const sbRev = Object.entries(d.staffBath).reduce((a,[k,v])=>a+(v||0)*(STAFF_BATH_RATES[k]||0),0);
  const sxRev = Object.entries(d.staffXtra).reduce((a,[k,v])=>a+(v||0)*(EXTRA_RATES[k]||0),0);
  const lb = d.labor||{};
  const totalHrs = (lb.pp||0)+(lb.bp||0)+(lb.hotel||0)+(lb.reception||0)+(lb.bather||0);
  const laborCost = totalHrs * (lb.rate||15);
  const totalRev = dcRev+bdRev+grRev+gxRev+sbRev+sxRev;
  return { dcDogs,dcRev,bdDogs,bdRev,grDogs,grRev,gxRev,sbDogs,sbRev,sxRev,totalHrs,laborCost,totalRev,
    totalDogs:dcDogs+bdDogs+grDogs+sbDogs, profit:totalRev-laborCost, labor:lb };
};

// ── COMPONENTS ──
const InputGrid = ({ rates, values, onChange, cols=4 }) => {
  const entries = Object.entries(rates);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:6 }}>
      {entries.map(([k]) => (
        <div key={k} style={{ display:'flex', alignItems:'center', gap:4 }}>
          <label style={{ fontSize:11, color:C.muted, width:90, flexShrink:0, textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }} title={k}>{k}</label>
          <input type="number" min="0" value={values[k]||''} placeholder="0"
            onChange={e => onChange(k, parseInt(e.target.value)||0)}
            style={{ width:'100%', background:C.input, border:`1px solid ${C.border}`, borderRadius:6, color:C.white,
              padding:'5px 8px', fontSize:13, outline:'none', textAlign:'center' }}
            onFocus={e => e.target.style.borderColor=C.teal}
            onBlur={e => e.target.style.borderColor=C.border}
          />
        </div>
      ))}
    </div>
  );
};

const Section = ({ title, icon, children, color, total, revenue, defaultOpen=false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:12, overflow:'hidden' }}>
      <div onClick={()=>setOpen(!open)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', cursor:'pointer', background: open ? C.dark : 'transparent', transition:'background .2s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.white }}>{title}</span>
          {total !== undefined && <span style={{ fontSize:12, color:color||C.teal, fontWeight:700, background:C.navy, padding:'2px 10px', borderRadius:20 }}>{total} dogs</span>}
          {revenue !== undefined && <span style={{ fontSize:12, color:C.amber, fontWeight:700, background:C.navy, padding:'2px 10px', borderRadius:20 }}>{fmt2(revenue)}</span>}
        </div>
        <span style={{ color:C.muted, fontSize:18, transform:open?'rotate(180deg)':'rotate(0)', transition:'transform .2s' }}>▾</span>
      </div>
      {open && <div style={{ padding:'12px 18px 18px' }}>{children}</div>}
    </div>
  );
};

const KPI = ({ label, value, color, sub, small }) => (
  <div style={{ background:`linear-gradient(135deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:14, padding: small ? '12px 16px' : '16px 20px' }}>
    <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1.3, fontWeight:700, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize: small ? 20 : 26, fontWeight:800, color:color||C.teal }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>}
  </div>
);

const ChartBox = ({ title, children, style:s }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, ...s }}>
    {title && <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1.2, marginBottom:14 }}>{title}</div>}
    {children}
  </div>
);

const CTooltip = ({ active, payload, label }) => {
  if (!active||!payload) return null;
  return (
    <div style={{ background:C.navy, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
      <div style={{ color:C.white, fontWeight:700, fontSize:13, marginBottom:4 }}>Day {label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color, fontSize:12, marginTop:2 }}>{p.name}: {typeof p.value==='number'? (p.dataKey?.includes('Dog')||p.dataKey?.includes('dog') ? p.value : fmt2(p.value)) : p.value}</div>)}
    </div>
  );
};

// ── MAIN APP ──
export default function App() {
  const [allData, setAllData] = useState({});
  const [currentMonth, setCurrentMonth] = useState('2026-03');
  const [currentDay, setCurrentDay] = useState(1);
  const [view, setView] = useState('entry'); // entry | dashboard
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const monthLabel = useMemo(() => {
    const [y,m] = currentMonth.split('-');
    return new Date(y, m-1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  }, [currentMonth]);

  const daysInMonth = useMemo(() => {
    const [y,m] = currentMonth.split('-');
    return new Date(y, m, 0).getDate();
  }, [currentMonth]);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) setAllData(JSON.parse(res.value));
      } catch(e) { console.log('No saved data yet'); }
      setLoading(false);
    })();
  }, []);

  // Save data
  const saveData = useCallback(async (newData) => {
    setSaving(true);
    setAllData(newData);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(newData));
    } catch(e) { console.error('Save failed', e); }
    setSaving(false);
  }, []);

  const dayKey = `${currentMonth}-${String(currentDay).padStart(2,'0')}`;
  const dayData = allData[dayKey] || emptyDay();

  const updateField = (section, key, val) => {
    const nd = { ...allData };
    if (!nd[dayKey]) nd[dayKey] = emptyDay();
    nd[dayKey] = { ...nd[dayKey], [section]: { ...nd[dayKey][section], [key]: val } };
    saveData(nd);
  };
  const updateLabor = (key, val) => {
    const nd = { ...allData };
    if (!nd[dayKey]) nd[dayKey] = emptyDay();
    nd[dayKey] = { ...nd[dayKey], labor: { ...nd[dayKey].labor, [key]: val } };
    saveData(nd);
  };

  // Build monthly chart data
  const monthData = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = `${currentMonth}-${String(d).padStart(2,'0')}`;
      const m = calcDayMetrics(allData[dk]);
      arr.push({ day: d, ...(m || { dcDogs:0,dcRev:0,bdDogs:0,bdRev:0,grDogs:0,grRev:0,gxRev:0,sbDogs:0,sbRev:0,sxRev:0,totalHrs:0,laborCost:0,totalRev:0,totalDogs:0,profit:0 }) });
    }
    return arr;
  }, [allData, currentMonth, daysInMonth]);

  const monthTotals = useMemo(() => {
    const t = { rev:0, labor:0, profit:0, dogs:0, dcRev:0, bdRev:0, grRev:0, gxRev:0, sbRev:0, sxRev:0, dcDogs:0, bdDogs:0, grDogs:0, sbDogs:0, hrs:0, days:0 };
    monthData.forEach(d => {
      if (d.totalRev > 0 || d.totalDogs > 0) t.days++;
      t.rev += d.totalRev; t.labor += d.laborCost; t.profit += d.profit; t.dogs += d.totalDogs;
      t.dcRev += d.dcRev; t.bdRev += d.bdRev; t.grRev += d.grRev; t.gxRev += d.gxRev; t.sbRev += d.sbRev; t.sxRev += d.sxRev;
      t.dcDogs += d.dcDogs; t.bdDogs += d.bdDogs; t.grDogs += d.grDogs; t.sbDogs += d.sbDogs; t.hrs += d.totalHrs;
    });
    return t;
  }, [monthData]);

  const todayMetrics = calcDayMetrics(dayData);

  const cumProfit = useMemo(() => {
    let cum = 0;
    return monthData.map(d => { cum += d.profit; return { day: d.day, cum }; });
  }, [monthData]);

  const clearDay = () => {
    const nd = { ...allData };
    delete nd[dayKey];
    saveData(nd);
  };

  const copyPrevDay = () => {
    if (currentDay <= 1) return;
    const prevKey = `${currentMonth}-${String(currentDay - 1).padStart(2,'0')}`;
    if (allData[prevKey]) {
      const nd = { ...allData, [dayKey]: JSON.parse(JSON.stringify(allData[prevKey])) };
      saveData(nd);
    }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:C.navy, color:C.teal, fontSize:20, fontWeight:700 }}>Loading Dashboard...</div>;

  return (
    <div style={{ fontFamily:"'Segoe UI',-apple-system,sans-serif", background:`linear-gradient(180deg,${C.navy},#0a1628)`, minHeight:'100vh', color:C.white }}>
      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg,${C.navy},${C.slate})`, borderBottom:`1px solid ${C.border}`, padding:'20px 24px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:C.teal, textTransform:'uppercase', letterSpacing:2, fontWeight:700 }}>Doral Location</div>
            <h1 style={{ fontSize:24, fontWeight:800, margin:'2px 0 0', background:`linear-gradient(90deg,${C.white},${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Doggies Gone Wild — KPI</h1>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {saving && <span style={{ fontSize:11, color:C.amber, alignSelf:'center' }}>Saving...</span>}
            <div style={{ background:C.teal, color:C.navy, borderRadius:10, padding:'6px 16px', fontWeight:800, fontSize:18 }}>
              {fmt(monthTotals.rev)}<div style={{ fontSize:9, fontWeight:600, opacity:.7 }}>MTD REVENUE</div>
            </div>
            <div style={{ background:monthTotals.profit>=0?'#1b5e20':'#b71c1c', color:'#fff', borderRadius:10, padding:'6px 16px', fontWeight:800, fontSize:18 }}>
              {fmt(monthTotals.profit)}<div style={{ fontSize:9, fontWeight:600, opacity:.7 }}>MTD PROFIT</div>
            </div>
          </div>
        </div>
        {/* NAV */}
        <div style={{ display:'flex', gap:6, marginTop:14, alignItems:'center', flexWrap:'wrap' }}>
          <input type="month" value={currentMonth} onChange={e=>setCurrentMonth(e.target.value)}
            style={{ background:C.input, border:`1px solid ${C.border}`, borderRadius:8, color:C.white, padding:'6px 12px', fontSize:13 }} />
          <div style={{ display:'flex', gap:4 }}>
            {['entry','dashboard'].map(v => (
              <button key={v} onClick={()=>setView(v)} style={{
                background:view===v?C.teal:'transparent', color:view===v?C.navy:C.muted,
                border:view===v?'none':`1px solid ${C.border}`, borderRadius:8, padding:'7px 18px',
                fontSize:13, fontWeight:700, cursor:'pointer', textTransform:'capitalize',
              }}>{v === 'entry' ? 'Daily Entry' : 'Dashboard'}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 24px 60px', maxWidth:1400, margin:'0 auto' }}>

        {/* ══════════ DATA ENTRY VIEW ══════════ */}
        {view === 'entry' && (<>
          {/* Day selector */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, color:C.muted, fontWeight:700 }}>Day:</span>
            <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                const dk = `${currentMonth}-${String(d).padStart(2,'0')}`;
                const hasData = !!allData[dk];
                return (
                  <button key={d} onClick={()=>setCurrentDay(d)} style={{
                    width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                    background: currentDay===d ? C.teal : hasData ? C.slate : C.input,
                    color: currentDay===d ? C.navy : hasData ? C.teal : C.muted,
                    transition:'all .15s',
                  }}>{d}</button>
                );
              })}
            </div>
          </div>

          {/* Day header + quick actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:800, margin:0, color:C.white }}>{monthLabel} — Day {currentDay}</h2>
              <div style={{ fontSize:12, color:C.muted }}>
                {new Date(currentMonth+'-'+String(currentDay).padStart(2,'0')).toLocaleDateString('en-US',{weekday:'long'})}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={copyPrevDay} style={{ background:C.slate, border:`1px solid ${C.border}`, borderRadius:8, color:C.sky, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>Copy Previous Day</button>
              <button onClick={clearDay} style={{ background:C.slate, border:`1px solid ${C.border}`, borderRadius:8, color:C.coral, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>Clear Day</button>
            </div>
          </div>

          {/* Day summary cards */}
          {todayMetrics && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10, marginBottom:16 }}>
              <KPI label="Total Revenue" value={fmt2(todayMetrics.totalRev)} small />
              <KPI label="Labor Cost" value={fmt2(todayMetrics.laborCost)} color={C.coral} small />
              <KPI label="Profit" value={fmt2(todayMetrics.profit)} color={todayMetrics.profit>=0?C.green:C.coral} small />
              <KPI label="Total Dogs" value={todayMetrics.totalDogs} color={C.amber} small />
              <KPI label="Daycare" value={`${todayMetrics.dcDogs} dogs`} color={C.sky} sub={fmt2(todayMetrics.dcRev)} small />
              <KPI label="Boarding" value={`${todayMetrics.bdDogs} dogs`} color={C.teal} sub={fmt2(todayMetrics.bdRev)} small />
            </div>
          )}

          {/* INPUT SECTIONS */}
          <Section title="Daycare" icon="🐕" color={C.sky} total={todayMetrics?.dcDogs} revenue={todayMetrics?.dcRev} defaultOpen={true}>
            <InputGrid rates={DAYCARE_RATES} values={dayData.daycare} onChange={(k,v)=>updateField('daycare',k,v)} cols={4} />
          </Section>

          <Section title="Boarding" icon="🏨" color={C.teal} total={todayMetrics?.bdDogs} revenue={todayMetrics?.bdRev}>
            <InputGrid rates={BOARDING_RATES} values={dayData.boarding} onChange={(k,v)=>updateField('boarding',k,v)} cols={4} />
          </Section>

          <Section title="Grooming (External)" icon="✂️" color={C.purple} total={todayMetrics?.grDogs} revenue={todayMetrics?.grRev}>
            <InputGrid rates={GROOMING_RATES} values={dayData.grooming} onChange={(k,v)=>updateField('grooming',k,v)} cols={4} />
          </Section>

          <Section title="Groomer Extras" icon="✨" revenue={todayMetrics?.gxRev}>
            <InputGrid rates={EXTRA_RATES} values={dayData.grXtra} onChange={(k,v)=>updateField('grXtra',k,v)} cols={4} />
          </Section>

          <Section title="Staff Bath" icon="🛁" color={C.pink} total={todayMetrics?.sbDogs} revenue={todayMetrics?.sbRev}>
            <InputGrid rates={STAFF_BATH_RATES} values={dayData.staffBath} onChange={(k,v)=>updateField('staffBath',k,v)} cols={3} />
          </Section>

          <Section title="Staff Extras" icon="💅" revenue={todayMetrics?.sxRev}>
            <InputGrid rates={EXTRA_RATES} values={dayData.staffXtra} onChange={(k,v)=>updateField('staffXtra',k,v)} cols={4} />
          </Section>

          <Section title="Staffing / Labor" icon="👥" defaultOpen={true}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
              {[['pp','Play Pen (PP)'],['bp','Back Pack (BP)'],['hotel','Hotel'],['reception','Reception'],['bather','Bather'],['rate','Hourly Rate ($)']].map(([k,label]) => (
                <div key={k}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>{label}</label>
                  <input type="number" min="0" step={k==='rate'?'0.5':'0.01'} value={dayData.labor?.[k]||''}
                    placeholder={k==='rate'?'15':'0'}
                    onChange={e=>updateLabor(k, parseFloat(e.target.value)||0)}
                    style={{ width:'100%', background:C.input, border:`1px solid ${C.border}`, borderRadius:8, color:C.white, padding:'8px 12px', fontSize:14, outline:'none', boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor=C.teal} onBlur={e=>e.target.style.borderColor=C.border}
                  />
                </div>
              ))}
            </div>
            {todayMetrics && (
              <div style={{ marginTop:12, display:'flex', gap:16, fontSize:13, color:C.muted }}>
                <span>Total Hours: <b style={{ color:C.white }}>{todayMetrics.totalHrs.toFixed(1)}</b></span>
                <span>Labor Cost: <b style={{ color:C.coral }}>{fmt2(todayMetrics.laborCost)}</b></span>
              </div>
            )}
          </Section>
        </>)}

        {/* ══════════ DASHBOARD VIEW ══════════ */}
        {view === 'dashboard' && (<>
          <h2 style={{ fontSize:18, fontWeight:800, margin:'16px 0 14px', color:C.white }}>{monthLabel} — Dashboard</h2>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10, marginBottom:20 }}>
            <KPI label="Total Revenue" value={fmt(monthTotals.rev)} sub={`${monthTotals.days} operating days`} />
            <KPI label="Gross Profit" value={fmt(monthTotals.profit)} color={monthTotals.profit>=0?C.green:C.coral} sub={monthTotals.rev?pct(monthTotals.profit/monthTotals.rev)+' margin':''} />
            <KPI label="Total Labor" value={fmt(monthTotals.labor)} color={C.coral} sub={monthTotals.rev?pct(monthTotals.labor/monthTotals.rev)+' of rev':''} />
            <KPI label="Avg Daily Rev" value={monthTotals.days?fmt(monthTotals.rev/monthTotals.days):'$0'} color={C.sky} />
            <KPI label="Total Dogs" value={monthTotals.dogs} color={C.amber} sub={monthTotals.days?`Avg ${(monthTotals.dogs/monthTotals.days).toFixed(0)}/day`:''} />
            <KPI label="Rev Per Dog" value={monthTotals.dogs?fmt2(monthTotals.rev/monthTotals.dogs):'$0'} color={C.purple} />
            <KPI label="Total Hours" value={monthTotals.hrs.toFixed(0)} color={C.sky} sub={monthTotals.hrs?fmt2(monthTotals.rev/monthTotals.hrs)+'/hr':''} />
            <KPI label="Labor/Dog" value={monthTotals.dogs?fmt2(monthTotals.labor/monthTotals.dogs):'$0'} color={C.pink} />
          </div>

          {/* Revenue by service pie + daily profit */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
            <ChartBox title="Daily Profit / Loss">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthData.filter(d=>d.totalRev>0||d.laborCost>0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="day" stroke={C.muted} fontSize={11} />
                  <YAxis stroke={C.muted} fontSize={11} tickFormatter={v=>'$'+v} />
                  <Tooltip content={<CTooltip />} />
                  <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3" />
                  <Bar dataKey="profit" name="Profit" radius={[4,4,0,0]}>
                    {monthData.filter(d=>d.totalRev>0||d.laborCost>0).map((d,i)=><Cell key={i} fill={d.profit>=0?C.teal:C.coral} opacity={.85} />)}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Revenue by Service">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[
                    {name:'Boarding',value:monthTotals.bdRev},{name:'Daycare',value:monthTotals.dcRev},
                    {name:'Grooming',value:monthTotals.grRev},{name:'Gr.Extras',value:monthTotals.gxRev},
                    {name:'Staff Bath',value:monthTotals.sbRev},{name:'Staff X',value:monthTotals.sxRev},
                  ].filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {PIE_C.map((c,i)=><Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)} />
                  <Legend wrapperStyle={{fontSize:11,color:C.muted}} />
                </PieChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>

          {/* Stacked revenue + cumulative profit */}
          <ChartBox title="Daily Revenue by Service Line" style={{ marginBottom:16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData.filter(d=>d.totalRev>0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="day" stroke={C.muted} fontSize={11} />
                <YAxis stroke={C.muted} fontSize={11} tickFormatter={v=>'$'+v} />
                <Tooltip content={<CTooltip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="bdRev" name="Boarding" stackId="r" fill={C.teal} />
                <Bar dataKey="dcRev" name="Daycare" stackId="r" fill={C.sky} />
                <Bar dataKey="grRev" name="Grooming" stackId="r" fill={C.purple} />
                <Bar dataKey="sbRev" name="Staff Bath" stackId="r" fill={C.pink} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <ChartBox title="Cumulative Profit">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={cumProfit}>
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.4}/><stop offset="100%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="day" stroke={C.muted} fontSize={11} />
                  <YAxis stroke={C.muted} fontSize={11} tickFormatter={v=>'$'+v} />
                  <Tooltip content={<CTooltip />} />
                  <ReferenceLine y={0} stroke={C.coral} strokeDasharray="5 3" />
                  <Area type="monotone" dataKey="cum" name="Cumulative" stroke={C.teal} fill="url(#cg)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>

            <ChartBox title="Dog Count by Service">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthData.filter(d=>d.totalDogs>0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="day" stroke={C.muted} fontSize={11} />
                  <YAxis stroke={C.muted} fontSize={11} />
                  <Tooltip content={<CTooltip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="dcDogs" name="Daycare" stackId="d" fill={C.sky} />
                  <Bar dataKey="bdDogs" name="Boarding" stackId="d" fill={C.teal} />
                  <Bar dataKey="grDogs" name="Grooming" stackId="d" fill={C.purple} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>

          {/* Revenue vs Labor */}
          <ChartBox title="Revenue vs Labor Cost" style={{ marginBottom:16 }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthData.filter(d=>d.totalRev>0||d.laborCost>0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="day" stroke={C.muted} fontSize={11} />
                <YAxis stroke={C.muted} fontSize={11} tickFormatter={v=>'$'+v} />
                <Tooltip content={<CTooltip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Line type="monotone" dataKey="totalRev" name="Revenue" stroke={C.teal} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="laborCost" name="Labor" stroke={C.coral} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>

          {/* Daily data table */}
          <ChartBox title="Daily Log">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>{['Day','DC Dogs','BD Dogs','GR Dogs','Daycare $','Boarding $','Grooming $','Total Rev','Labor $','Profit','Margin'].map(h =>
                    <th key={h} style={{ padding:'8px 10px', textAlign:'right', color:C.muted, borderBottom:`1px solid ${C.border}`, fontSize:10, textTransform:'uppercase', letterSpacing:.8 }}>{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {monthData.filter(d=>d.totalRev>0||d.totalDogs>0).map(d => {
                    const margin = d.totalRev ? d.profit/d.totalRev : 0;
                    return (
                      <tr key={d.day} style={{ borderBottom:`1px solid ${C.border}22` }} onClick={()=>{setCurrentDay(d.day);setView('entry');}} title="Click to edit">
                        <td style={{ padding:'6px 10px', color:C.white, fontWeight:700, cursor:'pointer' }}>{d.day}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.sky }}>{d.dcDogs}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.teal }}>{d.bdDogs}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.purple }}>{d.grDogs}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.white }}>{fmt2(d.dcRev)}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.white }}>{fmt2(d.bdRev)}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.white }}>{fmt2(d.grRev)}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.amber, fontWeight:700 }}>{fmt2(d.totalRev)}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:C.coral }}>{fmt2(d.laborCost)}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:d.profit>=0?C.green:C.coral, fontWeight:700 }}>{fmt2(d.profit)}</td>
                        <td style={{ padding:'6px 10px', textAlign:'right', color:margin>=.15?C.green:margin>=0?C.amber:C.coral }}>{d.totalRev?pct(margin):'-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:`2px solid ${C.teal}` }}>
                    <td style={{ padding:'8px 10px', fontWeight:800, color:C.teal }}>TOTAL</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.sky }}>{monthTotals.dcDogs}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.teal }}>{monthTotals.bdDogs}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.purple }}>{monthTotals.grDogs}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.white }}>{fmt(monthTotals.dcRev)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.white }}>{fmt(monthTotals.bdRev)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.white }}>{fmt(monthTotals.grRev)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:800, color:C.amber }}>{fmt(monthTotals.rev)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.coral }}>{fmt(monthTotals.labor)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:800, color:monthTotals.profit>=0?C.green:C.coral }}>{fmt(monthTotals.profit)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:C.teal }}>{monthTotals.rev?pct(monthTotals.profit/monthTotals.rev):'-'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ChartBox>
        </>)}
      </div>
    </div>
  );
}
