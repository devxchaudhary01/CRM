import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import {
  Bar,
  Line,
  Doughnut
} from 'react-chartjs-2'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

import {
  RiDownloadLine,
  RiBarChart2Line,
  RiCalendarLine,
  RiShareLine,
  RiFilePpt2Line
} from 'react-icons/ri'

import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

/* =========================
   CHART JS
========================= */

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

/* =========================
   API BASE URL
========================= */

const API = 'https://crm-backend-4yp0.onrender.com'

axios.defaults.baseURL = API

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm2_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* =========================
   CONSTANTS
========================= */

const PERIODS = [
  { k: 'week', lbl: 'This Week' },
  { k: 'month', lbl: 'Monthly' },
  { k: 'quarter', lbl: 'Quarter' },
  { k: 'half', lbl: 'Half Year' },
  { k: 'year', lbl: 'Yearly' }
]

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

const OUTCOME_LABEL = {
  I: 'Interested',
  NI: 'Not Interested',
  CB: 'Call Back',
  NA: 'No Answer',
  '': 'Pending'
}

/* =========================
   MAIN COMPONENT
========================= */

export default function ReportsPage() {

  const {
    canDownload,
    canShare,
    orgPlan
  } = useAuth()

  const [period, setPeriod] = useState('month')

  const [data, setData] = useState(null)

  const [daily, setDaily] = useState([])

  const [loading, setLoading] = useState(true)

  const reportRef = useRef()

  const chartRef1 = useRef()

  const chartRef2 = useRef()

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {

    try {

      setLoading(true)

      const [analyticsRes, dailyRes] =
        await Promise.all([

          axios.get(
            `/api/leads/analytics?period=${period}`
          ),

          axios.get('/api/leads/daily-report')

        ])

      setData(analyticsRes.data.analytics)

      setDaily(dailyRes.data.report)

    } catch (err) {

      console.log(err)

      toast.error('Failed to load reports')

    } finally {

      setLoading(false)

    }
  }

  /* =========================
     DOWNLOAD IMAGE
  ========================= */

  const downloadImage = async (
    ref,
    filename
  ) => {

    try {

      const { default: html2canvas } =
        await import('html2canvas')

      const canvas = await html2canvas(
        ref.current,
        {
          backgroundColor: '#ffffff',
          scale: 2
        }
      )

      const link =
        document.createElement('a')

      link.download =
        `${filename}_${period}_${new Date()
          .toISOString()
          .slice(0, 10)}.png`

      link.href =
        canvas.toDataURL('image/png')

      link.click()

      toast.success(
        'Chart downloaded!'
      )

    } catch (e) {

      toast.error(
        'Download failed'
      )

    }
  }

  /* =========================
     DOWNLOAD FULL REPORT
  ========================= */

  const downloadFullReport =
    async () => {

      try {

        const {
          default: html2canvas
        } = await import(
          'html2canvas'
        )

        const canvas =
          await html2canvas(
            reportRef.current,
            {
              backgroundColor:
                '#F4F6FB',
              scale: 2
            }
          )

        const link =
          document.createElement('a')

        link.download =
          `crm_full_report_${period}_${new Date()
            .toISOString()
            .slice(0, 10)}.png`

        link.href =
          canvas.toDataURL(
            'image/png'
          )

        link.click()

        toast.success(
          'Full report downloaded!'
        )

      } catch {

        toast.error(
          'Download failed'
        )

      }
    }

  /* =========================
     DOWNLOAD PPT
  ========================= */

  const downloadPPT = async () => {

    if (orgPlan !== 'pro') {
      return toast.error(
        'PPT export available only in Pro plan'
      )
    }

    try {

      toast('Generating PPT...', {
        icon: '📊'
      })

      const script =
        document.createElement(
          'script'
        )

      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundled.js'

      script.onload = () =>
        buildPPT()

      document.head.appendChild(
        script
      )

    } catch {

      toast.error(
        'PPT generation failed'
      )

    }
  }

  /* =========================
     BUILD PPT
  ========================= */

  const buildPPT = () => {

    try {

      const pptx =
        new window.PptxGenJS()

      const a = data || {}

      /* SLIDE 1 */

      const slide1 =
        pptx.addSlide()

      slide1.background = {
        color: '0A0F1E'
      }

      slide1.addText(
        'CRM Report',
        {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 1,
          fontSize: 34,
          bold: true,
          color: 'FFFFFF',
          align: 'center'
        }
      )

      slide1.addText(
        `Period: ${
          PERIODS.find(
            (p) =>
              p.k === period
          )?.lbl
        }`,
        {
          x: 0.5,
          y: 2.2,
          w: 9,
          h: 0.5,
          fontSize: 18,
          color: '3B6FFF',
          align: 'center'
        }
      )

      /* SLIDE 2 */

      const slide2 =
        pptx.addSlide()

      slide2.addText(
        'Summary Statistics',
        {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.5,
          fontSize: 24,
          bold: true
        }
      )

      const stats = [
        {
          label: 'Total',
          val: a.total || 0,
          color: '3B6FFF'
        },

        {
          label: 'Converted',
          val:
            a.converted || 0,
          color: '00C48C'
        },

        {
          label:
            'Not Converted',
          val:
            a.notConverted ||
            0,
          color: 'FF4757'
        },

        {
          label:
            'In Progress',
          val:
            a.inProgress ||
            0,
          color: 'FFA502'
        }
      ]

      stats.forEach(
        (s, i) => {

          const x =
            0.5 + i * 2.3

          slide2.addShape(
            pptx.ShapeType.rect,
            {
              x,
              y: 1.5,
              w: 2,
              h: 1.5,
              fill: {
                color: 'F4F6FB'
              },
              line: {
                color: s.color,
                width: 2
              }
            }
          )

          slide2.addText(
            String(s.val),
            {
              x,
              y: 1.7,
              w: 2,
              h: 0.5,
              align: 'center',
              fontSize: 26,
              bold: true,
              color: s.color
            }
          )

          slide2.addText(
            s.label,
            {
              x,
              y: 2.4,
              w: 2,
              h: 0.4,
              align: 'center',
              fontSize: 12,
              color: '64748B'
            }
          )
        }
      )

      pptx.writeFile({
        fileName:
          `crm_report_${period}.pptx`
      })

      toast.success(
        'PPT downloaded!'
      )

    } catch (e) {

      toast.error(
        'PPT failed'
      )

    }
  }

  /* =========================
     SHARE REPORT
  ========================= */

  const shareReport = async () => {

    try {

      const {
        default: html2canvas
      } = await import(
        'html2canvas'
      )

      const canvas =
        await html2canvas(
          reportRef.current,
          {
            backgroundColor:
              '#F4F6FB',
            scale: 1.5
          }
        )

      canvas.toBlob(
        async (blob) => {

          if (
            navigator.share &&
            blob
          ) {

            const file =
              new File(
                [blob],
                `crm_report_${period}.png`,
                {
                  type: 'image/png'
                }
              )

            try {

              await navigator.share({
                title:
                  'CRM Report',
                files: [file]
              })

            } catch {

              copyReportLink()

            }

          } else {

            copyReportLink()

          }
        },
        'image/png'
      )

    } catch {

      copyReportLink()

    }
  }

  const copyReportLink = () => {

    navigator.clipboard
      .writeText(
        window.location.href
      )
      .then(() => {

        toast.success(
          'Link copied!'
        )

      })
  }

  /* =========================
     LOADING
  ========================= */

  if (loading || !data) {

    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  const a = data

  /* =========================
     CHART DATA
  ========================= */

  const trendLabels =
    period === 'week'
      ? (a.dailyUploads || []).map(
          (d) => d._id
        )
      : (
          a.monthlyUploads || []
        ).map(
          (m) =>
            MONTHS[
              m._id.m - 1
            ]
        )

  const trendValues =
    period === 'week'
      ? (a.dailyUploads || []).map(
          (d) => d.count
        )
      : (
          a.monthlyUploads || []
        ).map((m) => m.count)

  const trendData = {
    labels: trendLabels,

    datasets: [
      {
        label:
          'Leads Uploaded',

        data: trendValues,

        backgroundColor:
          'rgba(59,111,255,.15)',

        borderColor:
          '#3B6FFF',

        borderWidth: 2,

        fill: true,

        tension: 0.4,

        pointBackgroundColor:
          '#3B6FFF',

        pointRadius: 4
      }
    ]
  }

  const trendOpts = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false
      }
    }
  }

  const statusData = {
    labels: [
      'Pending',
      'In Progress',
      'Converted',
      'Not Converted'
    ],

    datasets: [
      {
        data: [
          a.pending || 0,
          a.inProgress || 0,
          a.converted || 0,
          a.notConverted || 0
        ],

        backgroundColor: [
          '#94A3B8',
          '#3B6FFF',
          '#00C48C',
          '#FF4757'
        ],

        borderWidth: 0
      }
    ]
  }

  const statusOpts = {
    responsive: true,

    maintainAspectRatio: false,

    indexAxis: 'y',

    plugins: {
      legend: {
        display: false
      }
    }
  }

  const c1d = (
    a.c1Outcomes || []
  ).filter((o) => o._id)

  const c1DonutData = {
    labels: c1d.map(
      (o) =>
        OUTCOME_LABEL[o._id]
    ),

    datasets: [
      {
        data: c1d.map(
          (o) => o.count
        ),

        backgroundColor: [
          '#00C48C',
          '#FF4757',
          '#FFA502',
          '#94A3B8'
        ],

        borderWidth: 0
      }
    ]
  }

  const donutOpts = {
    responsive: true,

    maintainAspectRatio: false,

    cutout: '65%'
  }

  /* =========================
     UI
  ========================= */

  return (
    <div
      ref={reportRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        flex: 1
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >

        <div className="period-tabs">

          {PERIODS.map((p) => (

            <button
              key={p.k}
              className={`period-tab${
                period === p.k
                  ? ' active'
                  : ''
              }`}
              onClick={() =>
                setPeriod(p.k)
              }
            >
              {p.lbl}
            </button>

          ))}

        </div>

        <div
          style={{
            display: 'flex',
            gap: 8
          }}
        >

          {canDownload && (

            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                window.open(
                  `${API}/api/leads/download`,
                  '_blank'
                )
              }
            >
              <RiDownloadLine />
              Excel
            </button>

          )}

          <button
            className="btn btn-ghost btn-sm"
            onClick={
              downloadFullReport
            }
          >
            🖼️ PNG
          </button>

          {canShare && (

            <button
              className="btn btn-ghost btn-sm"
              onClick={
                shareReport
              }
            >
              <RiShareLine />
              Share
            </button>

          )}

          <button
            className="btn btn-sm"
            onClick={downloadPPT}
            style={{
              background:
                orgPlan === 'pro'
                  ? '#F59E0B'
                  : '#94A3B8',

              color: '#fff',

              border: 'none'
            }}
          >
            <RiFilePpt2Line />
            PPT
          </button>

        </div>

      </div>

      {/* STATS */}

      <div
        className="grid4"
        style={{ gap: 10 }}
      >

        {[
          {
            lbl: 'Total',
            val: a.total || 0,
            color: '#3B6FFF'
          },

          {
            lbl: 'Converted',
            val:
              a.converted || 0,
            color: '#00C48C'
          },

          {
            lbl:
              'Not Converted',
            val:
              a.notConverted ||
              0,
            color: '#FF4757'
          },

          {
            lbl:
              'In Progress',
            val:
              a.inProgress ||
              0,
            color: '#FFA502'
          }

        ].map((s) => (

          <div
            key={s.lbl}
            className="card"
            style={{
              borderLeft:
                `4px solid ${s.color}`,
              padding:
                '12px 14px'
            }}
          >

            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: s.color
              }}
            >
              {s.val}
            </div>

            <div
              style={{
                fontSize: 11,
                color:
                  'var(--muted)'
              }}
            >
              {s.lbl}
            </div>

          </div>

        ))}

      </div>

      {/* CHARTS */}

      <div
        className="row"
        style={{
          flex: '0 0 auto'
        }}
      >

        <div
          className="card col"
          ref={chartRef1}
        >

          <div
            className="card-header"
            style={{
              marginBottom: 8
            }}
          >

            <div>

              <div className="card-title">
                <RiBarChart2Line
                  style={{
                    marginRight: 6
                  }}
                />
                Upload Trend
              </div>

            </div>

            <button
              className="btn-icon"
              onClick={() =>
                downloadImage(
                  chartRef1,
                  'upload_trend'
                )
              }
            >
              🖼️
            </button>

          </div>

          <div
            style={{
              height: 160
            }}
          >

            <Line
              data={trendData}
              options={trendOpts}
            />

          </div>

        </div>

        <div
          className="card"
          style={{
            width: 280,
            flexShrink: 0
          }}
          ref={chartRef2}
        >

          <div
            className="card-header"
            style={{
              marginBottom: 8
            }}
          >

            <div className="card-title">
              Status Breakdown
            </div>

            <button
              className="btn-icon"
              onClick={() =>
                downloadImage(
                  chartRef2,
                  'status_breakdown'
                )
              }
            >
              🖼️
            </button>

          </div>

          <div
            style={{
              height: 160
            }}
          >

            <Bar
              data={statusData}
              options={statusOpts}
            />

          </div>

        </div>

      </div>

      {/* SECOND ROW */}

      <div
        className="row"
        style={{
          flex: 1,
          minHeight: 0
        }}
      >

        <div
          className="card"
          style={{
            width: 190,
            flexShrink: 0
          }}
        >

          <div
            className="card-header"
            style={{
              marginBottom: 8
            }}
          >

            <div className="card-title">
              C1 Outcomes
            </div>

          </div>

          <div
            style={{
              height: 130
            }}
          >

            {c1d.length > 0 ? (

              <Doughnut
                data={c1DonutData}
                options={donutOpts}
              />

            ) : (

              <div
                className="empty"
                style={{
                  padding: 20
                }}
              >
                <p>No C1 data</p>
              </div>

            )}

          </div>

        </div>

        {/* WORKER TABLE */}

        <div
          className="card col"
          style={{
            overflow: 'hidden'
          }}
        >

          <div className="card-header">

            <div className="card-title">
              Worker Performance
            </div>

          </div>

          <div
            style={{
              overflowY: 'auto',
              flex: 1
            }}
          >

            <table
              style={{
                fontSize: 12
              }}
            >

              <thead>

                <tr>
                  <th>Agent</th>
                  <th>Role</th>
                  <th>Leads Worked</th>
                </tr>

              </thead>

              <tbody>

                {(a.workerPerf ||
                  []).map(
                  (w, i) => (

                    <tr key={i}>

                      <td
                        style={{
                          fontWeight: 600
                        }}
                      >
                        {w.name}
                      </td>

                      <td>
                        <span className="badge b-blue">
                          {w.role}
                        </span>
                      </td>

                      <td>
                        {w.count}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* DAILY TABLE */}

      <div className="card">

        <div className="card-header">

          <div>

            <div className="card-title">
              <RiCalendarLine
                style={{
                  marginRight: 6
                }}
              />
              Daily Upload Report
            </div>

          </div>

        </div>

        <div
          style={{
            overflowX: 'auto',
            maxHeight: 180,
            overflowY: 'auto'
          }}
        >

          <table
            style={{
              fontSize: 12
            }}
          >

            <thead>

              <tr>
                <th>Date</th>
                <th>Uploaded</th>
                <th>Pending</th>
                <th>In Progress</th>
                <th>Converted</th>
                <th>Not Converted</th>
              </tr>

            </thead>

            <tbody>

              {daily
                .slice(0, 30)
                .map((r, i) => (

                  <tr key={i}>

                    <td>{r._id}</td>

                    <td>
                      {r.uploaded}
                    </td>

                    <td>
                      {r.pending}
                    </td>

                    <td>
                      {r.inProgress}
                    </td>

                    <td>
                      {r.converted}
                    </td>

                    <td>
                      {
                        r.notConverted
                      }
                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}