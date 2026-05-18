import React, { useMemo, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  RiCheckLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiRefreshLine,
  RiDownloadLine,
  RiLinkM,
  RiEyeLine,
  RiCloseLine,
  RiFileExcel2Line,
  RiDatabase2Line,
  RiCheckboxCircleFill,
} from 'react-icons/ri'

/* =========================================================
   API SETUP
========================================================= */

const API = 'https://crm-backend-4yp0.onrender.com'

const api = axios.create({
  baseURL: API,
})

/* =========================================================
   CRM FIELDS
========================================================= */

const CRM_FIELDS = [
  {
    key: 'name',
    label: 'Name',
    required: true,
    hint: 'Full name of the lead',
  },
  {
    key: 'contactNo',
    label: 'Contact Number',
    required: false,
    hint: 'Phone / mobile number',
  },
  {
    key: 'emailId',
    label: 'Email Address',
    required: false,
    hint: 'Lead email address',
  },
  {
    key: 'address',
    label: 'Address',
    required: false,
    hint: 'City / location / address',
  },
  {
    key: 'product',
    label: 'Product',
    required: false,
    hint: 'Product name/category',
  },
  {
    key: 'service',
    label: 'Service',
    required: false,
    hint: 'Service description/type',
  },
]

const STEPS = [
  { num: 1, label: 'Connect Sheet' },
  { num: 2, label: 'Select Data' },
  { num: 3, label: 'Map Fields' },
]

/* =========================================================
   STEP BAR
========================================================= */

function StepBar({ current }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 28,
      }}
    >
      {STEPS.map((step, index) => (
        <React.Fragment key={step.num}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13,
                transition: '.25s',
                background:
                  current > step.num
                    ? 'linear-gradient(135deg,#10B981,#059669)'
                    : current === step.num
                    ? 'linear-gradient(135deg,#3B82F6,#2563EB)'
                    : '#EEF2F7',
                color: current >= step.num ? '#fff' : '#64748B',
                border:
                  current < step.num
                    ? '2px solid #CBD5E1'
                    : '2px solid transparent',
                boxShadow:
                  current === step.num
                    ? '0 8px 20px rgba(59,130,246,.25)'
                    : 'none',
              }}
            >
              {current > step.num ? (
                <RiCheckLine size={18} />
              ) : (
                step.num
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    current >= step.num ? '#0F172A' : '#64748B',
                }}
              >
                {step.label}
              </div>
            </div>
          </div>

          {index !== STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 3,
                margin: '0 14px',
                borderRadius: 999,
                background:
                  current > step.num
                    ? 'linear-gradient(90deg,#10B981,#059669)'
                    : '#E2E8F0',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function GoogleSheetsModal({
  onClose,
  onImported,
}) {
  const [step, setStep] = useState(1)

  const [url, setUrl] = useState('')

  const [fetching, setFetching] = useState(false)
  const [importing, setImporting] = useState(false)

  const [columns, setColumns] = useState([])
  const [sampleRows, setSampleRows] = useState([])

  const [sheetId, setSheetId] = useState('')
  const [gid, setGid] = useState('0')
  const [rowCount, setRowCount] = useState(0)

  const [showSample, setShowSample] = useState(true)

  const [selected, setSelected] = useState({})

  const [mapping, setMapping] = useState({
    name: '',
    contactNo: '',
    emailId: '',
    address: '',
    product: '',
    service: '',
  })

  /* =========================================================
     SELECTED COLUMNS
  ========================================================= */

  const selectedColumns = useMemo(
    () => columns.filter((col) => selected[col]),
    [columns, selected]
  )

  const selectedCount = selectedColumns.length

  /* =========================================================
     FETCH SHEET
  ========================================================= */

  const handleFetch = async () => {
    const trimmed = url.trim()

    if (!trimmed) {
      return toast.error(
        'Please paste a Google Sheets link'
      )
    }

    if (
      !trimmed.includes(
        'docs.google.com/spreadsheets'
      )
    ) {
      return toast.error(
        'Please enter a valid Google Sheets URL'
      )
    }

    try {
      setFetching(true)

      const { data } = await api.post(
        '/api/sheets/preview',
        {
          url: trimmed,
        }
      )

      setColumns(data.columns || [])
      setRowCount(data.rowCount || 0)
      setSheetId(data.sheetId || '')
      setGid(data.gid || '0')
      setSampleRows(data.sampleRows || [])

      const autoSelected = {}

      ;(data.columns || []).forEach((col) => {
        autoSelected[col] = true
      })

      setSelected(autoSelected)

      /* =========================
         AUTO MAP
      ========================= */

      const autoMap = {
        name: '',
        contactNo: '',
        emailId: '',
        address: '',
        product: '',
        service: '',
      }

      ;(data.columns || []).forEach((col) => {
        const lower = col.toLowerCase()

        if (
          !autoMap.name &&
          lower.includes('name')
        ) {
          autoMap.name = col
        }

        if (
          !autoMap.contactNo &&
          (lower.includes('phone') ||
            lower.includes('mobile') ||
            lower.includes('contact'))
        ) {
          autoMap.contactNo = col
        }

        if (
          !autoMap.emailId &&
          lower.includes('email')
        ) {
          autoMap.emailId = col
        }

        if (
          !autoMap.address &&
          (lower.includes('address') ||
            lower.includes('city') ||
            lower.includes('location'))
        ) {
          autoMap.address = col
        }

        if (
          !autoMap.product &&
          lower.includes('product')
        ) {
          autoMap.product = col
        }

        if (
          !autoMap.service &&
          lower.includes('service')
        ) {
          autoMap.service = col
        }
      })

      setMapping(autoMap)

      toast.success(
        `Found ${data.columns.length} columns and ${data.rowCount} rows`
      )

      setStep(2)
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to fetch sheet'
      )
    } finally {
      setFetching(false)
    }
  }

  /* =========================================================
     TOGGLE COLUMN
  ========================================================= */

  const toggleColumn = (col) => {
    setSelected((prev) => ({
      ...prev,
      [col]: !prev[col],
    }))
  }

  const selectAll = () => {
    const all = {}

    columns.forEach((col) => {
      all[col] = true
    })

    setSelected(all)
  }

  const clearAll = () => {
    const cleared = {}

    columns.forEach((col) => {
      cleared[col] = false
    })

    setSelected(cleared)
  }

  /* =========================================================
     NEXT STEP
  ========================================================= */

  const goToMap = () => {
    if (!selectedCount) {
      return toast.error(
        'Please select at least one column'
      )
    }

    setStep(3)
  }

  /* =========================================================
     IMPORT DATA
  ========================================================= */

  const handleImport = async () => {
    if (!mapping.name) {
      return toast.error(
        'Please map the Name field'
      )
    }

    try {
      setImporting(true)

      const { data } = await api.post(
        '/api/sheets/import',
        {
          sheetId,
          gid,
          mapping,
        }
      )

      toast.success(
        data.message || 'Leads imported successfully'
      )

      onImported?.()
      onClose?.()
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Import failed'
      )
    } finally {
      setImporting(false)
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15,23,42,.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: 24,
          background: '#fff',
          boxShadow:
            '0 30px 80px rgba(0,0,0,.25)',
        }}
      >
        {/* =========================================================
            HEADER
        ========================================================= */}

        <div
          style={{
            padding: 28,
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background:
                    'linear-gradient(135deg,#2563EB,#1D4ED8)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RiFileExcel2Line size={28} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#0F172A',
                  }}
                >
                  Import Google Sheets
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: '#64748B',
                    marginTop: 3,
                  }}
                >
                  Import leads directly from your
                  spreadsheet
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: 12,
              background: '#F1F5F9',
              cursor: 'pointer',
            }}
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div style={{ padding: 28 }}>
          <StepBar current={step} />

          {/* =========================================================
              STEP 1
          ========================================================= */}

          {step === 1 && (
            <>
              <div
                style={{
                  padding: 20,
                  borderRadius: 18,
                  background:
                    'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
                  border: '1px solid #BFDBFE',
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: '#1D4ED8',
                    marginBottom: 12,
                  }}
                >
                  Before Importing Your Sheet
                </div>

                {[
                  'Open your Google Sheet',
                  'Click Share button',
                  'Select "Anyone with the link"',
                  'Set permission to Viewer',
                  'Paste the sheet URL below',
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 10,
                      color: '#334155',
                      fontSize: 13,
                    }}
                  >
                    <RiCheckboxCircleFill color="#2563EB" />
                    {item}
                  </div>
                ))}
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 10,
                    color: '#0F172A',
                  }}
                >
                  Google Sheets URL
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <input
                    value={url}
                    onChange={(e) =>
                      setUrl(e.target.value)
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      !fetching &&
                      handleFetch()
                    }
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    style={{
                      flex: 1,
                      height: 54,
                      borderRadius: 14,
                      border: '1.5px solid #CBD5E1',
                      padding: '0 18px',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />

                  <button
                    onClick={handleFetch}
                    disabled={fetching}
                    style={{
                      height: 54,
                      padding: '0 24px',
                      border: 'none',
                      borderRadius: 14,
                      background:
                        'linear-gradient(135deg,#2563EB,#1D4ED8)',
                      color: '#fff',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      minWidth: 180,
                      justifyContent: 'center',
                    }}
                  >
                    {fetching ? (
                      <>
                        <RiRefreshLine
                          style={{
                            animation:
                              'spin 1s linear infinite',
                          }}
                        />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RiLinkM />
                        Fetch Columns
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              STEP 2
          ========================================================= */}

          {step === 2 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(160px,1fr))',
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    label: 'Columns',
                    value: columns.length,
                  },
                  {
                    label: 'Rows',
                    value: rowCount,
                  },
                  {
                    label: 'Selected',
                    value: selectedCount,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: '#64748B',
                        marginBottom: 8,
                      }}
                    >
                      {item.label}
                    </div>

                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: '#0F172A',
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 18,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0F172A',
                  }}
                >
                  Select Columns To Import
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <button
                    onClick={clearAll}
                    style={smallBtn}
                  >
                    Clear
                  </button>

                  <button
                    onClick={selectAll}
                    style={smallBtn}
                  >
                    Select All
                  </button>

                  <button
                    onClick={() =>
                      setShowSample(!showSample)
                    }
                    style={smallBtn}
                  >
                    <RiEyeLine />
                    {showSample
                      ? 'Hide'
                      : 'Preview'}
                  </button>
                </div>
              </div>

              {/* =========================
                 COLUMN GRID
              ========================= */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill,minmax(180px,1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col}
                    onClick={() =>
                      toggleColumn(col)
                    }
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: selected[col]
                        ? '2px solid #2563EB'
                        : '1.5px solid #E2E8F0',
                      background: selected[col]
                        ? '#EFF6FF'
                        : '#fff',
                      cursor: 'pointer',
                      transition: '.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selected[col]
                            ? '#2563EB'
                            : '#fff',
                          border: selected[col]
                            ? 'none'
                            : '2px solid #CBD5E1',
                        }}
                      >
                        {selected[col] && (
                          <RiCheckLine
                            color="#fff"
                            size={14}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {col}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* =========================
                 PREVIEW TABLE
              ========================= */}

              {showSample &&
                sampleRows.length > 0 && (
                  <div
                    style={{
                      overflowX: 'auto',
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      marginBottom: 24,
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse:
                          'collapse',
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: '#F8FAFC',
                          }}
                        >
                          {columns.map((col) => (
                            <th
                              key={col}
                              style={{
                                padding: 14,
                                textAlign: 'left',
                                borderBottom:
                                  '1px solid #E2E8F0',
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {sampleRows.map(
                          (row, i) => (
                            <tr key={i}>
                              {columns.map(
                                (col) => (
                                  <td
                                    key={col}
                                    style={{
                                      padding: 14,
                                      borderBottom:
                                        '1px solid #F1F5F9',
                                      whiteSpace:
                                        'nowrap',
                                    }}
                                  >
                                    {row[col] ||
                                      '—'}
                                  </td>
                                )
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginTop: 10,
                }}
              >
                <button
                  onClick={() => setStep(1)}
                  style={ghostBtn}
                >
                  <RiArrowLeftLine />
                  Back
                </button>

                <button
                  onClick={goToMap}
                  style={primaryBtn}
                >
                  Map Fields
                  <RiArrowRightLine />
                </button>
              </div>
            </>
          )}

          {/* =========================================================
              STEP 3
          ========================================================= */}

          {step === 3 && (
            <>
              <div
                style={{
                  marginBottom: 24,
                  padding: 18,
                  borderRadius: 18,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: 6,
                  }}
                >
                  CRM Field Mapping
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#64748B',
                  }}
                >
                  Match Google Sheet columns with
                  CRM fields
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {CRM_FIELDS.map((field) => {
                  const mapped =
                    !!mapping[field.key]

                  return (
                    <div
                      key={field.key}
                      style={{
                        padding: 18,
                        borderRadius: 18,
                        border: mapped
                          ? '1.5px solid #10B981'
                          : field.required
                          ? '1.5px solid #EF4444'
                          : '1.5px solid #E2E8F0',
                        background: mapped
                          ? '#F0FDF4'
                          : '#fff',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '1fr 1fr',
                          gap: 20,
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 15,
                              marginBottom: 4,
                            }}
                          >
                            {field.required && (
                              <span
                                style={{
                                  color:
                                    '#EF4444',
                                }}
                              >
                                *
                              </span>
                            )}{' '}
                            {field.label}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748B',
                            }}
                          >
                            {field.hint}
                          </div>
                        </div>

                        <select
                          value={
                            mapping[field.key]
                          }
                          onChange={(e) =>
                            setMapping(
                              (prev) => ({
                                ...prev,
                                [field.key]:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          style={{
                            height: 52,
                            borderRadius: 14,
                            border:
                              '1.5px solid #CBD5E1',
                            padding:
                              '0 14px',
                            fontSize: 14,
                            outline: 'none',
                          }}
                        >
                          <option value="">
                            Select Column
                          </option>

                          {selectedColumns.map(
                            (col) => (
                              <option
                                key={col}
                                value={col}
                              >
                                {col}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* =========================
                 SUMMARY
              ========================= */}

              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  borderRadius: 18,
                  background:
                    'linear-gradient(135deg,#F8FAFC,#EFF6FF)',
                  border: '1px solid #DBEAFE',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <RiDatabase2Line
                    size={20}
                    color="#2563EB"
                  />

                  <div
                    style={{
                      fontWeight: 800,
                      color: '#0F172A',
                    }}
                  >
                    Import Summary
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 18,
                    fontSize: 13,
                    color: '#475569',
                  }}
                >
                  <div>
                    Rows:{' '}
                    <strong>{rowCount}</strong>
                  </div>

                  <div>
                    Selected Columns:{' '}
                    <strong>
                      {selectedCount}
                    </strong>
                  </div>

                  <div>
                    Mapped Fields:{' '}
                    <strong>
                      {
                        Object.values(
                          mapping
                        ).filter(Boolean)
                          .length
                      }
                      /{CRM_FIELDS.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginTop: 28,
                }}
              >
                <button
                  onClick={() => setStep(2)}
                  style={ghostBtn}
                >
                  <RiArrowLeftLine />
                  Back
                </button>

                <button
                  onClick={handleImport}
                  disabled={
                    importing || !mapping.name
                  }
                  style={{
                    ...successBtn,
                    opacity:
                      importing || !mapping.name
                        ? 0.7
                        : 1,
                  }}
                >
                  {importing ? (
                    <>
                      <RiRefreshLine
                        style={{
                          animation:
                            'spin 1s linear infinite',
                        }}
                      />
                      Importing...
                    </>
                  ) : (
                    <>
                      <RiDownloadLine />
                      Import Leads
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          ANIMATION
      ========================================================= */}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/* =========================================================
   BUTTONS
========================================================= */

const primaryBtn = {
  height: 52,
  padding: '0 22px',
  border: 'none',
  borderRadius: 14,
  background:
    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  color: '#fff',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
}

const successBtn = {
  height: 52,
  padding: '0 22px',
  border: 'none',
  borderRadius: 14,
  background:
    'linear-gradient(135deg,#10B981,#059669)',
  color: '#fff',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
}

const ghostBtn = {
  height: 52,
  padding: '0 22px',
  border: '1px solid #CBD5E1',
  borderRadius: 14,
  background: '#fff',
  color: '#0F172A',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
}

const smallBtn = {
  height: 36,
  padding: '0 14px',
  border: '1px solid #CBD5E1',
  borderRadius: 10,
  background: '#fff',
  color: '#0F172A',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
  fontSize: 12,
}