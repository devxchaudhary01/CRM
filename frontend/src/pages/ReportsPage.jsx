import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { RiDownloadLine, RiBarChart2Line, RiCalendarLine, RiShareLine, RiFilePpt2Line } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

const PERIODS = [
  { k:'week',    lbl:'This Week'  },
  { k:'month',   lbl:'Monthly'   },
  { k:'quarter', lbl:'Quarter'   },
  { k:'half',    lbl:'Half Year' },
  { k:'year',    lbl:'Yearly'    },
]
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const OUTCOME_LABEL = { I:'Interested', NI:'Not Interested', CB:'Call Back', NA:'No Answer', '':'Pending' }

export default function ReportsPage() {
  const { canDownload, canShare, orgPlan } = useAuth()
  const [period, setPeriod]   = useState('month')
  const [data, setData]       = useState(null)
  const [daily, setDaily]     = useState([])
  const [loading, setLoading] = useState(true)
  const reportRef = useRef()
  const chartRef1 = useRef()
  const chartRef2 = useRef()

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      const [a, b] = await Promise.all([
        axios.get(`/api/leads/analytics?period=${period}`),
        axios.get('/api/leads/daily-report'),
      ])
      setData(a.data.analytics)
      setDaily(b.data.report)
    } catch { toast.error('Failed to load reports') }
    finally { setLoading(false) }
  }

  // Download chart/section as PNG image
  const downloadImage = async (ref, filename) => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(ref.current, { backgroundColor:'#ffffff', scale:2 })
      const link = document.createElement('a')
      link.download = `${filename}_${period}_${new Date().toISOString().slice(0,10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Chart downloaded as image!')
    } catch(e) { toast.error('Download failed: ' + e.message) }
  }

  // Download full report as PNG
  const downloadFullReport = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(reportRef.current, { backgroundColor:'#F4F6FB', scale:2 })
      const link = document.createElement('a')
      link.download = `crm_full_report_${period}_${new Date().toISOString().slice(0,10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Full report downloaded!')
    } catch(e) { toast.error('Download failed') }
  }

  // Download as PPT (Pro plan only) — uses PptxGenJS via CDN
  const downloadPPT = async () => {
    if (orgPlan !== 'pro') {
      return toast.error('PPT export is a Pro plan feature. Upgrade to access.')
    }
    try {
      toast('Generating PPT…', { icon: '📊' })
      // Dynamically load pptxgenjs from CDN
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundled.js'
      script.onload = () => buildPPT()
      document.head.appendChild(script)
    } catch(e) { toast.error('PPT generation failed') }
  }

  const buildPPT = () => {
    try {
      const pptx = new window.PptxGenJS()
      const a = data || {}
      const orgName = document.title || 'CRM Report'

      // ── Slide 1: Title ──
      const slide1 = pptx.addSlide()
      slide1.background = { color: '0A0F1E' }
      slide1.addText('CRM Report', { x:0.5, y:1.2, w:9, h:1.2, fontSize:40, fontFace:'Arial', bold:true, color:'FFFFFF', align:'center' })
      slide1.addText(`Period: ${PERIODS.find(p=>p.k===period)?.lbl || period}`, { x:0.5, y:2.5, w:9, h:0.6, fontSize:18, color:'3B6FFF', align:'center' })
      slide1.addText(`Generated: ${new Date().toLocaleDateString()}`, { x:0.5, y:3.2, w:9, h:0.5, fontSize:13, color:'94A3B8', align:'center' })

      // ── Slide 2: Summary Stats ──
      const slide2 = pptx.addSlide()
      slide2.addText('Summary Statistics', { x:0.5, y:0.3, w:9, h:0.6, fontSize:22, bold:true, color:'0A0F1E' })
      const stats = [
        { label:'Total Leads',    val: a.total||0,        color:'3B6FFF' },
        { label:'Pending',        val: a.pending||0,      color:'FFA502' },
        { label:'In Progress',    val: a.inProgress||0,   color:'3B6FFF' },
        { label:'Converted',      val: a.converted||0,    color:'00C48C' },
        { label:'Not Converted',  val: a.notConverted||0, color:'FF4757' },
      ]
      stats.forEach((s, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 0.5 + col * 3.1
        const y = 1.2 + row * 1.8
        slide2.addShape(pptx.ShapeType.rect, { x, y, w:2.8, h:1.5, fill:{ color:'F4F6FB' }, line:{ color:s.color, width:3 } })
        slide2.addText(String(s.val), { x, y:y+0.1, w:2.8, h:0.9, fontSize:32, bold:true, color:s.color, align:'center', fontFace:'Arial' })
        slide2.addText(s.label, { x, y:y+0.9, w:2.8, h:0.5, fontSize:11, color:'64748B', align:'center' })
      })

      // ── Slide 3: Upload Trend Chart ──
      const slide3 = pptx.addSlide()
      slide3.addText('Upload Trend', { x:0.5, y:0.3, w:9, h:0.6, fontSize:22, bold:true, color:'0A0F1E' })
      const trendData = (a.monthlyUploads||[]).map(m => ({ name: MONTHS[m._id.m-1], labels: MONTHS[m._id.m-1], values: m.count }))
      if (trendData.length > 0) {
        slide3.addChart(pptx.ChartType.bar, [{ name:'Leads Uploaded', labels: trendData.map(d=>d.name), values: trendData.map(d=>d.values) }], {
          x:0.5, y:1, w:9, h:5,
          chartColors:['3B6FFF'],
          showLegend: false,
          catAxisLabelFontSize: 11,
          valAxisLabelFontSize: 11,
        })
      } else {
        slide3.addText('No data for this period', { x:1,y:2.5,w:8,h:1,fontSize:16,color:'94A3B8',align:'center' })
      }

      // ── Slide 4: Status Breakdown ──
      const slide4 = pptx.addSlide()
      slide4.addText('Lead Status Breakdown', { x:0.5, y:0.3, w:9, h:0.6, fontSize:22, bold:true, color:'0A0F1E' })
      const statusLabels = ['Pending','In Progress','Converted','Not Converted']
      const statusVals   = [a.pending||0, a.inProgress||0, a.converted||0, a.notConverted||0]
      slide4.addChart(pptx.ChartType.pie, [{ name:'Status', labels:statusLabels, values:statusVals }], {
        x:1, y:1, w:8, h:5,
        chartColors:['94A3B8','3B6FFF','00C48C','FF4757'],
        showLegend:true, legendPos:'b', legendFontSize:12,
        showPercent:true,
      })

      // ── Slide 5: Worker Performance ──
      const slide5 = pptx.addSlide()
      slide5.addText('Worker Performance', { x:0.5, y:0.3, w:9, h:0.6, fontSize:22, bold:true, color:'0A0F1E' })
      const workers = a.workerPerf || []
      const tblData = [
        [{ text:'Agent', options:{ bold:true, color:'FFFFFF', fill:'3B6FFF' } }, { text:'Role', options:{ bold:true, color:'FFFFFF', fill:'3B6FFF' } }, { text:'Leads Worked', options:{ bold:true, color:'FFFFFF', fill:'3B6FFF' } }],
        ...workers.map(w => [w.name||'', w.role||'', String(w.count||0)])
      ]
      if (workers.length > 0) {
        slide5.addTable(tblData, { x:0.5, y:1, w:9, fontSize:12, border:{ type:'solid', color:'E2E8F0' }, rowH:0.45 })
      } else {
        slide5.addText('No worker data yet', { x:1,y:2.5,w:8,h:1,fontSize:16,color:'94A3B8',align:'center' })
      }

      // ── Slide 6: Daily Report ──
      const slide6 = pptx.addSlide()
      slide6.addText('Daily Upload Report', { x:0.5, y:0.3, w:9, h:0.6, fontSize:22, bold:true, color:'0A0F1E' })
      const dailyRows = daily.slice(0,10)
      const dailyTbl = [
        [{ text:'Date', options:{bold:true,color:'FFFFFF',fill:'0A0F1E'} }, { text:'Uploaded', options:{bold:true,color:'FFFFFF',fill:'0A0F1E'} }, { text:'Pending', options:{bold:true,color:'FFFFFF',fill:'0A0F1E'} }, { text:'Converted', options:{bold:true,color:'FFFFFF',fill:'0A0F1E'} }, { text:'Not Conv.', options:{bold:true,color:'FFFFFF',fill:'0A0F1E'} }],
        ...dailyRows.map(r => [r._id, String(r.uploaded), String(r.pending), String(r.converted), String(r.notConverted)])
      ]
      if (dailyRows.length > 0) {
        slide6.addTable(dailyTbl, { x:0.5, y:1, w:9, fontSize:11, border:{ type:'solid', color:'E2E8F0' }, rowH:0.42 })
      } else {
        slide6.addText('No daily data yet', { x:1,y:2.5,w:8,h:1,fontSize:16,color:'94A3B8',align:'center' })
      }

      pptx.writeFile({ fileName: `crm_report_${period}_${new Date().toISOString().slice(0,10)}.pptx` })
      toast.success('PPT downloaded!')
    } catch(e) { toast.error('PPT build failed: ' + e.message) }
  }

  // Share report via Web Share API or copy link
  const shareReport = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(reportRef.current, { backgroundColor:'#F4F6FB', scale:1.5 })
      canvas.toBlob(async (blob) => {
        if (navigator.share && blob) {
          const file = new File([blob], `crm_report_${period}.png`, { type:'image/png' })
          try {
            await navigator.share({ title:'CRM Report', files:[file] })
          } catch { copyReportLink() }
        } else { copyReportLink() }
      }, 'image/png')
    } catch { copyReportLink() }
  }

  const copyReportLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => toast.success('Report link copied to clipboard!'))
  }

  if (loading || !data) return <div className="loading"><div className="spinner"/></div>
  const a = data

  // Chart configs
  const trendLabels = period === 'week'
    ? (a.dailyUploads||[]).map(d => d._id)
    : (a.monthlyUploads||[]).map(m => MONTHS[m._id.m-1])
  const trendValues = period === 'week'
    ? (a.dailyUploads||[]).map(d => d.count)
    : (a.monthlyUploads||[]).map(m => m.count)

  const trendData = {
    labels: trendLabels,
    datasets:[{
      label:'Leads Uploaded', data:trendValues,
      backgroundColor:'rgba(59,111,255,.15)', borderColor:'#3B6FFF',
      borderWidth:2, fill:true, tension:.4, pointBackgroundColor:'#3B6FFF', pointRadius:4,
    }]
  }
  const trendOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ display:false } },
    scales:{ y:{ grid:{ color:'#F0F4FB' }, ticks:{ font:{ family:'Outfit', size:11 } } }, x:{ grid:{ display:false }, ticks:{ font:{ family:'Outfit', size:11 } } } }
  }

  const statusData = {
    labels:['Pending','In Progress','Converted','Not Converted'],
    datasets:[{
      data:[a.pending||0, a.inProgress||0, a.converted||0, a.notConverted||0],
      backgroundColor:['#94A3B8','#3B6FFF','#00C48C','#FF4757'], borderWidth:0,
    }]
  }
  const statusOpts = {
    responsive:true, maintainAspectRatio:false, indexAxis:'y',
    plugins:{ legend:{ display:false } },
    scales:{ x:{ grid:{ color:'#F0F4FB' }, ticks:{ font:{ family:'Outfit', size:11 } } }, y:{ grid:{ display:false }, ticks:{ font:{ family:'Outfit', size:11 } } } }
  }

  const c1d = (a.c1Outcomes||[]).filter(o => o._id)
  const c1DonutData = {
    labels: c1d.map(o => OUTCOME_LABEL[o._id] || o._id),
    datasets:[{ data: c1d.map(o => o.count), backgroundColor:['#00C48C','#FF4757','#FFA502','#94A3B8'], borderWidth:0 }]
  }
  const donutOpts = {
    responsive:true, maintainAspectRatio:false, cutout:'65%',
    plugins:{ legend:{ position:'bottom', labels:{ font:{ family:'Outfit', size:11 }, padding:8, boxWidth:10 } } }
  }

  return (
    <div ref={reportRef} style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>

      {/* Header controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div className="period-tabs">
          {PERIODS.map(p => (
            <button key={p.k} className={`period-tab${period===p.k?' active':''}`} onClick={() => setPeriod(p.k)}>
              {p.lbl}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {canDownload && (
            <button className="btn btn-outline btn-sm" onClick={() => window.open('/api/leads/download')}>
              <RiDownloadLine/> Excel
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={downloadFullReport}>
            🖼️ PNG Report
          </button>
          {canShare && (
            <button className="btn btn-ghost btn-sm" onClick={shareReport}>
              <RiShareLine/> Share
            </button>
          )}
          <button
            className="btn btn-sm"
            onClick={downloadPPT}
            style={{ background: orgPlan==='pro' ? '#F59E0B' : '#94A3B8', color:'#fff', border:'none' }}
            title={orgPlan!=='pro' ? 'Upgrade to Pro for PPT export' : 'Download as PowerPoint'}
          >
            <RiFilePpt2Line/> PPT {orgPlan!=='pro' && '🔒'}
          </button>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid4" style={{ gap:10 }}>
        {[
          { lbl:'Total',         val:a.total||0,        color:'#3B6FFF' },
          { lbl:'Converted',     val:a.converted||0,    color:'#00C48C' },
          { lbl:'Not Converted', val:a.notConverted||0, color:'#FF4757' },
          { lbl:'In Progress',   val:a.inProgress||0,   color:'#FFA502' },
        ].map(s => (
          <div key={s.lbl} className="card" style={{ borderLeft:`4px solid ${s.color}`, padding:'12px 14px' }}>
            <div style={{ fontSize:24, fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="row" style={{ flex:'0 0 auto' }}>
        <div className="card col" ref={chartRef1}>
          <div className="card-header" style={{ marginBottom:8 }}>
            <div>
              <div className="card-title"><RiBarChart2Line style={{ marginRight:6 }}/>Upload Trend — {PERIODS.find(p=>p.k===period)?.lbl}</div>
              <div className="card-sub">Total leads uploaded over time</div>
            </div>
            <button className="btn-icon" onClick={() => downloadImage(chartRef1,'upload_trend')} title="Download chart">🖼️</button>
          </div>
          <div style={{ height:160 }}><Line data={trendData} options={trendOpts}/></div>
        </div>
        <div className="card" style={{ width:280, flexShrink:0 }} ref={chartRef2}>
          <div className="card-header" style={{ marginBottom:8 }}>
            <div className="card-title">Status Breakdown</div>
            <button className="btn-icon" onClick={() => downloadImage(chartRef2,'status_breakdown')}>🖼️</button>
          </div>
          <div style={{ height:160 }}><Bar data={statusData} options={statusOpts}/></div>
        </div>
      </div>

      {/* Charts row 2 + worker table */}
      <div className="row" style={{ flex:1, minHeight:0 }}>
        <div className="card" style={{ width:190, flexShrink:0 }}>
          <div className="card-header" style={{ marginBottom:8 }}><div className="card-title">C1 Outcomes</div></div>
          <div style={{ height:130 }}>
            {c1d.length > 0
              ? <Doughnut data={c1DonutData} options={donutOpts}/>
              : <div className="empty" style={{ padding:20 }}><p>No C1 data</p></div>
            }
          </div>
        </div>

        <div className="card col" style={{ overflow:'hidden' }}>
          <div className="card-header"><div className="card-title">Worker Performance</div></div>
          <div style={{ overflowY:'auto', flex:1 }}>
            <table style={{ fontSize:12 }}>
              <thead><tr><th>Agent</th><th>Role</th><th>Leads Worked</th></tr></thead>
              <tbody>
                {(a.workerPerf||[]).map((w,i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:600 }}>{w.name}</td>
                    <td><span className="badge b-blue">{w.role}</span></td>
                    <td className="mono fw7">{w.count}</td>
                  </tr>
                ))}
                {!(a.workerPerf||[]).length && (
                  <tr><td colSpan={3} style={{ textAlign:'center', color:'var(--muted)', padding:16 }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily report table */}
      <div className="card" style={{ flex:'0 0 auto' }}>
        <div className="card-header">
          <div>
            <div className="card-title"><RiCalendarLine style={{ marginRight:6 }}/>Daily Upload Report</div>
            <div className="card-sub">Date-wise data with work summary</div>
          </div>
        </div>
        <div style={{ overflowX:'auto', maxHeight:180, overflowY:'auto' }}>
          <table style={{ fontSize:12 }}>
            <thead>
              <tr>
                <th>Date</th><th>Uploaded</th><th>Pending</th>
                <th>In Progress</th><th>Converted</th><th>Not Converted</th>
              </tr>
            </thead>
            <tbody>
              {daily.slice(0,30).map((r,i) => (
                <tr key={i}>
                  <td className="mono fw6">{r._id}</td>
                  <td><span className="badge b-blue">{r.uploaded}</span></td>
                  <td><span className="badge b-gray">{r.pending}</span></td>
                  <td><span className="badge b-amber">{r.inProgress}</span></td>
                  <td><span className="badge b-green">{r.converted}</span></td>
                  <td><span className="badge b-red">{r.notConverted}</span></td>
                </tr>
              ))}
              {!daily.length && (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--muted)', padding:16 }}>No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
