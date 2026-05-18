import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

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
   COMPONENT
========================= */

export default function RegisterPage() {

  const { setUser } = useAuth()

  const nav = useNavigate()

  const [loading, setLoading] =
    useState(false)

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    orgName: ''
  })

  const set =
    (k) =>
    (e) =>
      setF((p) => ({
        ...p,
        [k]: e.target.value
      }))

  /* =========================
     SUBMIT
  ========================= */

  const submit = async (e) => {

    e.preventDefault()

    if (!f.name.trim()) {
      return toast.error(
        'Your name is required'
      )
    }

    if (!f.orgName.trim()) {
      return toast.error(
        'Organization name is required'
      )
    }

    if (f.password.length < 6) {
      return toast.error(
        'Password must be at least 6 characters'
      )
    }

    try {

      setLoading(true)

      const res = await axios.post(
        '/api/auth/register',
        {
          name: f.name.trim(),
          email: f.email.trim(),
          password: f.password,
          phone: f.phone,
          orgName: f.orgName.trim()
        }
      )

      /* SAVE TOKEN */

      if (res.data.token) {

        localStorage.setItem(
          'crm2_token',
          res.data.token
        )

      }

      /* OPTIONAL USER SAVE */

      if (
        res.data.user &&
        setUser
      ) {
        setUser(res.data.user)
      }

      toast.success(
        'Organization created successfully!'
      )

      nav('/dashboard')

    } catch (err) {

      console.log(err)

      toast.error(
        err.response?.data
          ?.message ||
          'Registration failed'
      )

    } finally {

      setLoading(false)

    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="auth-page">

      <div className="auth-glow" />

      <div
        className="auth-card"
        style={{
          maxWidth: 520
        }}
      >

        {/* BRAND */}

        <div className="auth-brand">

          <div className="auth-mark">
            CR
          </div>

          <div>

            <h1
              style={{
                fontSize: 20,
                fontWeight: 900
              }}
            >
              CRM Pro
            </h1>

            <span
              style={{
                fontSize: 11,
                color:
                  'var(--muted)'
              }}
            >
              Register your organization
            </span>

          </div>

        </div>

        {/* TITLE */}

        <h2>Create Organization</h2>

        <p className="sub">
          Set up your organization on
          CRM Pro
        </p>

        {/* FORM */}

        <form onSubmit={submit}>

          {/* ORG NAME */}

          <div className="form-group">

            <label>
              🏢 Organization Name{' '}
              <span
                style={{
                  color:
                    'var(--danger)'
                }}
              >
                *
              </span>
            </label>

            <input
              placeholder="e.g. ABC Corp"
              value={f.orgName}
              onChange={set('orgName')}
              required
            />

          </div>

          {/* ROW */}

          <div className="form-row">

            <div className="form-group">

              <label>
                Your Full Name *
              </label>

              <input
                placeholder="John Doe"
                value={f.name}
                onChange={set('name')}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Phone
              </label>

              <input
                placeholder="+91 9876543210"
                value={f.phone}
                onChange={set('phone')}
              />

            </div>

          </div>

          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email Address *
            </label>

            <input
              type="email"
              placeholder="you@company.com"
              value={f.email}
              onChange={set('email')}
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <label>
              Password *
            </label>

            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={f.password}
              onChange={set('password')}
              required
            />

          </div>

          {/* BUTTON */}

          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: 10,
              padding: '11px'
            }}
            disabled={loading}
          >

            {loading
              ? 'Creating...'
              : 'Create Organization →'}

          </button>

        </form>

        {/* LOGIN */}

        <div
          className="auth-link"
          style={{
            marginTop: 14
          }}
        >

          Already registered?{' '}

          <Link to="/login">
            Sign in
          </Link>

        </div>

        {/* INFO */}

        <div className="auth-info">

          As a{' '}
          <strong>
            Business Owner
          </strong>
          , you can upload leads,
          manage your team,
          download reports,
          assign roles,
          and track analytics.

        </div>

      </div>

    </div>
  )
}