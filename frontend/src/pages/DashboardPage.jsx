import React, { useEffect, useState } from 'react'
import axios from 'axios'

import { Bar, Doughnut } from 'react-chartjs-2'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

import { useAuth } from '../context/AuthContext'

import {
  RiUserAddLine,
  RiCheckLine,
  RiPhoneLine,
  RiBarChartLine,
  RiTimeLine,
  RiUploadLine,
} from 'react-icons/ri'

/* ✅ DEPLOYED BACKEND API */
const API = 'https://crm-backend-4yp0.onrender.com'

/* ✅ AXIOS CONFIG */
axios.defaults.baseURL = API

axios.interceptors.request.use(config => {
  const token =
    localStorage.getItem('crm2_token') ||
    localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
)

/* ───────────────────────────── */

const timeAgo = d => {
  const s = Math.floor(
    (Date.now() - new Date(d)) / 1000
  )

  if (s < 60) return `${s}s ago`

  if (s < 3600)
    return `${Math.floor(s / 60)}m ago`

  if (s < 86400)
    return `${Math.floor(s / 3600)}h ago`

  return `${Math.floor(s / 86400)}d ago`
}

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
  'Dec',
]

export default function DashboardPage() {
  const {
    user,
    canUpload,
    canDownload,
  } = useAuth()

  const [data, setData] = useState(null)
  const [acts, setActs] = useState([])

  const [period, setPeriod] =
    useState('month')

  const [loading, setLoading] =
    useState(true)

  /* ─── LOAD DASHBOARD ───────────────── */

  const load = async () => {
    setLoading(true)

    try {
      const [analyticsRes, actsRes] =
        await Promise.all([
          axios.get(
            `/api/leads/analytics?period=${period}`
          ),

          axios.get(
            '/api/leads/activities'
          ),
        ])

      setData(
        analyticsRes.data.analytics
      )

      setActs(
        actsRes.data.activities || []
      )
    } catch (e) {
      console.log(e)

      setData(null)
      setActs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [period])

  /* ─── LOADING ──────────────────────── */

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  const a = data || {}

  /* ─── BAR CHART ────────────────────── */

  const barData = {
    labels: (a.monthlyUploads || []).map(
      m => MONTHS[m._id.m - 1]
    ),

    datasets: [
      {
        label: 'Uploads',

        data: (
          a.monthlyUploads || []
        ).map(m => m.count),

        backgroundColor: '#3B6FFF',

        borderRadius: 6,

        borderSkipped: false,
      },
    ],
  }

  const barOpts = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      y: {
        grid: {
          color: '#F0F4FB',
        },

        ticks: {
          font: {
            family: 'Outfit',
            size: 11,
          },
        },
      },

      x: {
        grid: {
          display: false,
        },

        ticks: {
          font: {
            family: 'Outfit',
            size: 11,
          },
        },
      },
    },
  }

  /* ─── DONUT CHART ──────────────────── */

  const donutData = {
    labels: [
      'Pending',
      'In Progress',
      'Converted',
      'Not Converted',
    ],

    datasets: [
      {
        data: [
          a.pending || 0,
          a.inProgress || 0,
          a.converted || 0,
          a.notConverted || 0,
        ],

        backgroundColor: [
          '#94A3B8',
          '#3B6FFF',
          '#00C48C',
          '#FF4757',
        ],

        borderWidth: 0,
      },
    ],
  }

  const donutOpts = {
    responsive: true,

    maintainAspectRatio: false,

    cutout: '68%',

    plugins: {
      legend: {
        position: 'bottom',

        labels: {
          font: {
            family: 'Outfit',
            size: 11,
          },

          padding: 10,
          boxWidth: 10,
        },
      },
    },
  }

  return (
    <>
      {/* GREETING */}

      <div>
        <h2
          style={{
            fontFamily:
              'Outfit,sans-serif',

            fontSize: 21,

            fontWeight: 800,

            letterSpacing: '-.3px',
          }}
        >
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
            ? 'afternoon'
            : 'evening'}
          ,{' '}
          {user?.name?.split(' ')[0]} 👋
        </h2>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 13,
            marginTop: 2,
          }}
        >
          Here's your leads overview.
        </p>
      </div>

      {/* STATS */}

      <div className="grid4">
        {[
          {
            icon: <RiUserAddLine />,
            cls: 'si-blue',
            val: a.total || 0,
            lbl: 'Total Leads',
          },

          {
            icon: <RiTimeLine />,
            cls: 'si-amber',
            val: a.pending || 0,
            lbl: 'Pending',
          },

          {
            icon: <RiPhoneLine />,
            cls: 'si-navy',
            val: a.inProgress || 0,
            lbl: 'In Progress',
          },

          {
            icon: <RiCheckLine />,
            cls: 'si-green',
            val: a.converted || 0,
            lbl: 'Converted',
          },
        ].map((s, i) => (
          <div className="card" key={i}>
            <div className="stat">
              <div
                className={`stat-icon ${s.cls}`}
              >
                {s.icon}
              </div>

              <div>
                <div className="stat-val">
                  {s.val}
                </div>

                <div className="stat-lbl">
                  {s.lbl}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS */}

      <div
        className="row"
        style={{
          alignItems: 'flex-start',
        }}
      >
        {/* BAR */}

        <div className="card col">
          <div
            className="card-header"
            style={{
              marginBottom: 10,
            }}
          >
            <div>
              <div className="card-title">
                Upload Trend
              </div>

              <div className="card-sub">
                Lead uploads over time
              </div>
            </div>

            <div className="period-tabs">
              {[
                'week',
                'month',
                'quarter',
                'half',
                'year',
              ].map(p => (
                <button
                  key={p}
                  className={`period-tab${
                    period === p
                      ? ' active'
                      : ''
                  }`}
                  onClick={() =>
                    setPeriod(p)
                  }
                >
                  {p === 'week'
                    ? 'Week'
                    : p === 'month'
                    ? 'Month'
                    : p === 'quarter'
                    ? 'Q'
                    : p === 'half'
                    ? 'H1'
                    : 'Year'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 170 }}>
            <Bar
              data={barData}
              options={barOpts}
            />
          </div>
        </div>

        {/* DONUT */}

        <div
          className="card"
          style={{
            width: 210,
            flexShrink: 0,
          }}
        >
          <div
            className="card-header"
            style={{
              marginBottom: 8,
            }}
          >
            <div className="card-title">
              Status Mix
            </div>
          </div>

          <div style={{ height: 170 }}>
            <Doughnut
              data={donutData}
              options={donutOpts}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM */}

      <div
        className="row"
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ACTIVITIES */}

        <div className="card col scroll-y">
          <div className="card-header">
            <div className="card-title">
              Recent Activity
            </div>
          </div>

          {acts
            .slice(0, 12)
            .map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom:
                    '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    marginTop: 5,
                    flexShrink: 0,

                    background:
                      act.action ===
                      'upload'
                        ? 'var(--success)'
                        : act.action ===
                          'download'
                        ? 'var(--warning)'
                        : act.action ===
                          'delete'
                        ? 'var(--danger)'
                        : 'var(--primary)',
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: 12,
                    }}
                  >
                    <strong>
                      {act.user?.name}
                    </strong>{' '}
                    — {act.description}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color:
                        'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    {timeAgo(
                      act.createdAt
                    )}
                  </div>
                </div>
              </div>
            ))}

          {!acts.length && (
            <div className="empty">
              <div className="empty-icon">
                📋
              </div>

              <p>No activities yet</p>
            </div>
          )}
        </div>

        {/* SIDE CARDS */}

        <div
          style={{
            width: 190,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* NOT CONVERTED */}

          <div className="card">
            <div
              className="card-title"
              style={{
                marginBottom: 10,
                fontSize: 13,
              }}
            >
              Not Converted
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                fontFamily:
                  'Outfit,sans-serif',
                color: 'var(--danger)',
              }}
            >
              {a.notConverted || 0}
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                marginTop: 2,
              }}
            >
              leads marked Not Converted
            </div>
          </div>

          {/* QUICK ACTIONS */}

          <div className="card">
            <div
              className="card-title"
              style={{
                marginBottom: 10,
                fontSize: 13,
              }}
            >
              Quick Actions
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              {canUpload && (
                <a
                  href="/leads"
                  className="btn btn-primary btn-sm"
                >
                  <RiUploadLine /> Upload
                  Data
                </a>
              )}

              {canDownload && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() =>
                    window.open(
                      `${API}/api/leads/download`,
                      '_blank'
                    )
                  }
                >
                  📥 Export Excel
                </button>
              )}

              <a
                href="/reports"
                className="btn btn-ghost btn-sm"
              >
                <RiBarChartLine /> View
                Reports
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}