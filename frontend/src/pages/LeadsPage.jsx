import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react'

import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

import {
  RiSearchLine,
  RiUploadLine,
  RiDownloadLine,
  RiSaveLine,
  RiCloseLine,
  RiEditLine,
  RiRefreshLine,
  RiAddCircleLine,
} from 'react-icons/ri'

import GoogleSheetsModal from '../components/leads/GoogleSheetsModal'

/* ✅ DEPLOYED BACKEND API */
const API = 'https://crm-backend-4yp0.onrender.com'

/* ─── AXIOS CONFIG ───────────────────────── */

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

/* ─── STATUS ─────────────────────────────── */

const STATUS_BADGE = {
  pending: 'b-gray',
  in_progress: 'b-blue',
  converted: 'b-green',
  not_converted: 'b-red',
}

const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In Progress',
  converted: 'Converted',
  not_converted: 'Not Converted',
}

const OUTCOMES = [
  { k: 'I', lbl: 'Interested' },
  { k: 'NI', lbl: 'Not Interested' },
  { k: 'CB', lbl: 'Call Back' },
  { k: 'NA', lbl: 'No Answer' },
]

/* ─── OUTCOME BUTTONS ───────────────────── */

function OutcomeBtn({
  value,
  onChange,
  disabled,
}) {
  return (
    <div className="outcome-row">
      {OUTCOMES.map(o => (
        <button
          key={o.k}
          type="button"
          className={`outcome-btn${
            value === o.k ? ' sel-' + o.k : ''
          }`}
          onClick={() =>
            !disabled && onChange(o.k)
          }
          disabled={disabled}
        >
          {o.lbl}
        </button>
      ))}
    </div>
  )
}

/* ─── CALL PANEL ────────────────────────── */

function CallPanel({
  label,
  call,
  onChange,
  canEdit,
  isOptional,
  enabled,
  showEnable,
  onEnable,
}) {
  if (isOptional && !enabled) {
    return showEnable ? (
      <button
        className="btn btn-ghost btn-xs"
        onClick={onEnable}
      >
        <RiAddCircleLine /> Add {label}
      </button>
    ) : (
      <span className="muted fs11">—</span>
    )
  }

  return (
    <div style={{ minWidth: 148 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: 'var(--muted)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </div>

      {canEdit ? (
        <>
          <OutcomeBtn
            value={call?.outcome || ''}
            onChange={v =>
              onChange({
                ...call,
                outcome: v,
              })
            }
          />

          <input
            type="date"
            className="ie"
            style={{
              marginTop: 5,
              width: '100%',
            }}
            value={
              call?.date
                ? String(call.date).substring(
                    0,
                    10
                  )
                : ''
            }
            onChange={e =>
              onChange({
                ...call,
                date: e.target.value,
              })
            }
          />

          <input
            className="ie"
            style={{ marginTop: 4 }}
            placeholder="Notes…"
            value={call?.notes || ''}
            onChange={e =>
              onChange({
                ...call,
                notes: e.target.value,
              })
            }
          />
        </>
      ) : (
        <div>
          {call?.outcome ? (
            <span
              className={`badge ${
                call.outcome === 'I'
                  ? 'b-green'
                  : call.outcome === 'NI'
                  ? 'b-red'
                  : call.outcome === 'CB'
                  ? 'b-amber'
                  : 'b-gray'
              }`}
            >
              {
                OUTCOMES.find(
                  o => o.k === call.outcome
                )?.lbl
              }
            </span>
          ) : (
            <span className="muted fs11">
              —
            </span>
          )}

          {call?.date && (
            <div className="fs11 muted">
              {new Date(
                call.date
              ).toLocaleDateString()}
            </div>
          )}

          {call?.doneBy?.name && (
            <div className="fs11 muted">
              by {call.doneBy.name}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── MAIN PAGE ─────────────────────────── */

export default function LeadsPage() {
  const {
    canUpload,
    canDownload,
    user,
  } = useAuth()

  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const [search, setSearch] =
    useState('')

  const [statusF, setStatusF] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [editId, setEditId] =
    useState(null)

  const [editData, setEditData] =
    useState({})

  const [saving, setSaving] =
    useState(false)

  const [customCols, setCustomCols] =
    useState([])

  const [showUpload, setShowUpload] =
    useState(false)

  const [showSheets, setShowSheets] =
    useState(false)

  const [uploading, setUploading] =
    useState(false)

  const fileRef = useRef()

  const role = user?.role || ''

  const canEditC1 = [
    'c1',
    'ops_lead',
    'ops_manager',
    'org_owner',
    'super_admin',
  ].includes(role)

  const canEditC2 = [
    'c2',
    'ops_lead',
    'ops_manager',
    'org_owner',
    'super_admin',
  ].includes(role)

  const canEditC3 = [
    'c3',
    'ops_lead',
    'ops_manager',
    'org_owner',
    'super_admin',
  ].includes(role)

  const canWork =
    canEditC1 || canEditC2 || canEditC3

  /* ─── LOAD CUSTOM COLUMNS ───────────── */

  const loadCustomCols =
    useCallback(async () => {
      try {
        const { data } =
          await axios.get(
            '/api/leads/org-columns'
          )

        setCustomCols(
          data.customColumns || []
        )
      } catch (e) {
        console.log(e)
      }
    }, [])

  /* ─── FETCH LEADS ───────────────────── */

  const fetchLeads = useCallback(
    async () => {
      setLoading(true)

      try {
        const { data } =
          await axios.get('/api/leads', {
            params: {
              page,
              limit: 15,
              search,
              status: statusF,
            },
          })

        setLeads(data.leads || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
      } catch (e) {
        toast.error(
          e.response?.data?.message ||
            'Failed to load leads'
        )
      } finally {
        setLoading(false)
      }
    },
    [page, statusF, search]
  )

  useEffect(() => {
    fetchLeads()
    loadCustomCols()
  }, [page, statusF])

  useEffect(() => {
    const t = setTimeout(
      fetchLeads,
      400
    )

    return () => clearTimeout(t)
  }, [search])

  /* ─── EDIT ──────────────────────────── */

  const startEdit = l => {
    setEditId(l._id)

    setEditData({
      c1: {
        outcome:
          l.c1?.outcome || '',
        date: l.c1?.date
          ? String(l.c1.date).substring(
              0,
              10
            )
          : '',
        notes: l.c1?.notes || '',
      },

      c2: {
        outcome:
          l.c2?.outcome || '',
        date: l.c2?.date
          ? String(l.c2.date).substring(
              0,
              10
            )
          : '',
        notes: l.c2?.notes || '',
      },

      c3: {
        outcome:
          l.c3?.outcome || '',
        date: l.c3?.date
          ? String(l.c3.date).substring(
              0,
              10
            )
          : '',
        notes: l.c3?.notes || '',
      },

      product: l.product || '',
      service: l.service || '',

      customData: {
        ...(l.customData || {}),
      },
    })
  }

  /* ─── SAVE ──────────────────────────── */

  const save = async () => {
    setSaving(true)

    try {
      await axios.put(
        `/api/leads/${editId}`,
        editData
      )

      toast.success(
        'Saved Successfully'
      )

      setEditId(null)

      fetchLeads()
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          'Save failed'
      )
    } finally {
      setSaving(false)
    }
  }

  /* ─── DOWNLOAD ─────────────────────── */

  const doDownload = async () => {
    try {
      const res = await axios.get(
        '/api/leads/download',
        {
          responseType: 'blob',
        }
      )

      const url =
        URL.createObjectURL(res.data)

      const a =
        document.createElement('a')

      a.href = url
      a.download = 'leads.xlsx'

      a.click()

      toast.success('Downloaded!')
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          'Download failed'
      )
    }
  }

  /* ─── UPLOAD ───────────────────────── */

  const doUpload = async file => {
    if (!file) return

    const fd = new FormData()

    fd.append('file', file)

    setUploading(true)

    try {
      const { data } =
        await axios.post(
          '/api/leads/upload',
          fd,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
          }
        )

      toast.success(
        `${data.count} leads imported!`
      )

      setShowUpload(false)

      fetchLeads()
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          'Upload failed'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* TOOLBAR */}

      <div className="toolbar">
        <div className="search-wrap">
          <RiSearchLine />

          <input
            placeholder="Search name, email, contact…"
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="btn btn-ghost btn-sm"
          value={statusF}
          onChange={e =>
            setStatusF(e.target.value)
          }
        >
          <option value="">
            All Status
          </option>

          {Object.entries(
            STATUS_LABEL
          ).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <button
          className="btn-icon"
          onClick={fetchLeads}
        >
          <RiRefreshLine />
        </button>

        {canUpload && (
          <>
            <button
              className="btn btn-sm"
              style={{
                background:
                  'linear-gradient(135deg,#4285F4,#34A853)',
                color: '#fff',
                border: 'none',
              }}
              onClick={() =>
                setShowSheets(true)
              }
            >
              📊 Google Sheets
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                setShowUpload(true)
              }
            >
              <RiUploadLine /> Upload Excel
            </button>
          </>
        )}

        {canDownload && (
          <button
            className="btn btn-success btn-sm"
            onClick={doDownload}
          >
            <RiDownloadLine /> Export
          </button>
        )}
      </div>

      {/* TABLE */}

      <div
        className="tbl-wrap"
        style={{ flex: 1 }}
      >
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Product</th>
              <th>Service</th>

              {customCols.map(col => (
                <th key={col.key}>
                  {col.label}
                </th>
              ))}

              <th>C1</th>
              <th>C2</th>
              <th>C3</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    12 +
                    customCols.length
                  }
                  style={{
                    textAlign: 'center',
                    padding: 30,
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : !leads.length ? (
              <tr>
                <td
                  colSpan={
                    12 +
                    customCols.length
                  }
                  style={{
                    textAlign: 'center',
                    padding: 30,
                  }}
                >
                  No Leads Found
                </td>
              </tr>
            ) : (
              leads.map((l, i) => {
                const isEditing =
                  editId === l._id

                return (
                  <tr key={l._id}>
                    <td>
                      {(page - 1) * 15 +
                        i +
                        1}
                    </td>

                    <td>{l.name}</td>

                    <td>
                      {l.emailId || '—'}
                    </td>

                    <td>
                      {l.contactNo || '—'}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          className="ie"
                          value={
                            editData.product
                          }
                          onChange={e =>
                            setEditData(
                              d => ({
                                ...d,
                                product:
                                  e.target
                                    .value,
                              })
                            )
                          }
                        />
                      ) : (
                        l.product || '—'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          className="ie"
                          value={
                            editData.service
                          }
                          onChange={e =>
                            setEditData(
                              d => ({
                                ...d,
                                service:
                                  e.target
                                    .value,
                              })
                            )
                          }
                        />
                      ) : (
                        l.service || '—'
                      )}
                    </td>

                    {customCols.map(col => (
                      <td key={col.key}>
                        {isEditing ? (
                          <input
                            className="ie"
                            value={
                              editData
                                .customData?.[
                                col.key
                              ] || ''
                            }
                            onChange={e =>
                              setEditData(
                                d => ({
                                  ...d,
                                  customData:
                                    {
                                      ...d.customData,
                                      [col.key]:
                                        e
                                          .target
                                          .value,
                                    },
                                })
                              )
                            }
                          />
                        ) : (
                          l.customData?.[
                            col.key
                          ] || '—'
                        )}
                      </td>
                    ))}

                    <td>
                      {isEditing &&
                      canEditC1 ? (
                        <CallPanel
                          label="C1"
                          call={
                            editData.c1
                          }
                          onChange={v =>
                            setEditData(
                              d => ({
                                ...d,
                                c1: v,
                              })
                            )
                          }
                          canEdit
                        />
                      ) : (
                        <CallPanel
                          label="C1"
                          call={l.c1}
                          canEdit={
                            false
                          }
                        />
                      )}
                    </td>

                    <td>
                      {isEditing &&
                      canEditC2 ? (
                        <CallPanel
                          label="C2"
                          call={
                            editData.c2
                          }
                          onChange={v =>
                            setEditData(
                              d => ({
                                ...d,
                                c2: v,
                              })
                            )
                          }
                          canEdit
                        />
                      ) : (
                        <CallPanel
                          label="C2"
                          call={l.c2}
                          canEdit={
                            false
                          }
                        />
                      )}
                    </td>

                    <td>
                      {isEditing &&
                      canEditC3 ? (
                        <CallPanel
                          label="C3"
                          call={
                            editData.c3
                          }
                          onChange={v =>
                            setEditData(
                              d => ({
                                ...d,
                                c3: v,
                              })
                            )
                          }
                          canEdit
                        />
                      ) : (
                        <CallPanel
                          label="C3"
                          call={l.c3}
                          canEdit={
                            false
                          }
                        />
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          STATUS_BADGE[
                            l.status
                          ] || 'b-gray'
                        }`}
                      >
                        {STATUS_LABEL[
                          l.status
                        ] || l.status}
                      </span>
                    </td>

                    <td>
                      {isEditing ? (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 5,
                          }}
                        >
                          <button
                            className="btn btn-success btn-xs"
                            onClick={
                              save
                            }
                            disabled={
                              saving
                            }
                          >
                            {saving ? (
                              '...'
                            ) : (
                              <RiSaveLine />
                            )}
                          </button>

                          <button
                            className="btn-icon"
                            onClick={() =>
                              setEditId(
                                null
                              )
                            }
                          >
                            <RiCloseLine />
                          </button>
                        </div>
                      ) : (
                        canWork && (
                          <button
                            className="btn-icon"
                            onClick={() =>
                              startEdit(
                                l
                              )
                            }
                          >
                            <RiEditLine />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}

      {pages > 1 && (
        <div className="pagination">
          <button
            className="pg"
            onClick={() =>
              setPage(p => p - 1)
            }
            disabled={page === 1}
          >
            ‹
          </button>

          {Array.from(
            {
              length: Math.min(
                pages,
                7
              ),
            },
            (_, i) => (
              <button
                key={i + 1}
                className={`pg${
                  page === i + 1
                    ? ' on'
                    : ''
                }`}
                onClick={() =>
                  setPage(i + 1)
                }
              >
                {i + 1}
              </button>
            )
          )}

          <button
            className="pg"
            onClick={() =>
              setPage(p => p + 1)
            }
            disabled={page === pages}
          >
            ›
          </button>
        </div>
      )}

      {/* GOOGLE SHEETS */}

      {showSheets && (
        <GoogleSheetsModal
          onClose={() =>
            setShowSheets(false)
          }
          onImported={fetchLeads}
        />
      )}

      {/* UPLOAD MODAL */}

      {showUpload && (
        <div
          className="overlay"
          onClick={() =>
            setShowUpload(false)
          }
        >
          <div
            className="modal"
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div className="modal-head">
              <div>
                <div className="modal-title">
                  Upload Excel / CSV
                </div>

                <div className="modal-sub">
                  Supports XLSX, XLS,
                  CSV
                </div>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowUpload(false)
                }
              >
                ×
              </button>
            </div>

            <div
              className="upload-zone"
              onClick={() =>
                fileRef.current.click()
              }
              onDragOver={e =>
                e.preventDefault()
              }
              onDrop={e => {
                e.preventDefault()

                doUpload(
                  e.dataTransfer
                    .files[0]
                )
              }}
            >
              <div className="upload-icon">
                📊
              </div>

              <h4>
                Click or drag & drop
                here
              </h4>

              <p>
                Supports .xlsx .xls
                .csv
              </p>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={e =>
                  doUpload(
                    e.target
                      .files[0]
                  )
                }
              />
            </div>

            {uploading && (
              <p
                style={{
                  textAlign:
                    'center',
                  marginTop: 12,
                }}
              >
                Uploading...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}