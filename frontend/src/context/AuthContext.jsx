import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import axios from 'axios'

/* =========================================================
   API CONFIG
========================================================= */

export const API = axios.create({
  baseURL: 'https://crm-backend-4yp0.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const [token, setToken] = useState(() => {
    return localStorage.getItem('crm2_token') || null
  })

  const [loading, setLoading] = useState(true)

  /* =========================================================
     SET TOKEN IN AXIOS
  ========================================================= */

  useEffect(() => {
    if (token) {
      API.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`
    } else {
      delete API.defaults.headers.common[
        'Authorization'
      ]
    }
  }, [token])

  /* =========================================================
     AUTO LOGIN / GET USER
  ========================================================= */

  useEffect(() => {
    const getCurrentUser = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await API.get('/auth/me')

        setUser(data.user)
      } catch (error) {
        console.error(
          'Auth Error:',
          error.response?.data || error.message
        )

        localStorage.removeItem('crm2_token')

        delete API.defaults.headers.common[
          'Authorization'
        ]

        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [token])

  /* =========================================================
     SAVE AUTH DATA
  ========================================================= */

  const saveAuth = (tok, usr) => {
    localStorage.setItem('crm2_token', tok)

    API.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${tok}`

    setToken(tok)
    setUser(usr)
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', {
        email,
        password,
      })

      if (!data?.token) {
        throw new Error('Token not received')
      }

      saveAuth(data.token, data.user)

      return data.user
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          'Login failed'
      )
    }
  }

  /* =========================================================
     REGISTER
  ========================================================= */

  const register = async (payload) => {
    try {
      const { data } = await API.post(
        '/auth/register',
        payload
      )

      if (data?.token) {
        saveAuth(data.token, data.user)
      }

      return data
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          'Registration failed'
      )
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    localStorage.removeItem('crm2_token')

    delete API.defaults.headers.common[
      'Authorization'
    ]

    setToken(null)
    setUser(null)
  }

  /* =========================================================
     GOOGLE LOGIN TOKEN
  ========================================================= */

  const setTokenManually = async (tok) => {
    try {
      localStorage.setItem('crm2_token', tok)

      API.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${tok}`

      setToken(tok)

      const { data } = await API.get('/auth/me')

      setUser(data.user)

      return data.user
    } catch (error) {
      logout()

      throw new Error(
        error.response?.data?.message ||
          'Google login failed'
      )
    }
  }

  /* =========================================================
     ROLES
  ========================================================= */

  const role = user?.role || ''

  const isSuperAdmin = role === 'super_admin'

  const isOrgOwner = role === 'org_owner'

  const isOpsManager = role === 'ops_manager'

  const isOpsLead = role === 'ops_lead'

  const isAgent = ['c1', 'c2', 'c3'].includes(role)

  /* =========================================================
     PERMISSIONS
  ========================================================= */

  const canDownload = [
    'org_owner',
    'ops_manager',
    'super_admin',
  ].includes(role)

  const canUpload = [
    'org_owner',
    'super_admin',
  ].includes(role)

  const canManage = [
    'org_owner',
    'ops_manager',
    'super_admin',
  ].includes(role)

  const canAssignRoles = [
    'org_owner',
    'ops_manager',
    'super_admin',
  ].includes(role)

  const canViewDash = !isAgent

  const canViewReports = [
    'org_owner',
    'ops_manager',
    'super_admin',
  ].includes(role)

  const canShare = [
    'org_owner',
    'ops_manager',
    'super_admin',
  ].includes(role)

  const canSetFollowUp = [
    'org_owner',
    'super_admin',
  ].includes(role)

  /* =========================================================
     ORG INFO
  ========================================================= */

  const orgName =
    user?.organization?.name || ''

  const orgPlan =
    user?.organization?.plan || 'free'

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  const value = useMemo(
    () => ({
      user,
      token,
      loading,

      login,
      register,
      logout,
      setTokenManually,

      role,

      isSuperAdmin,
      isOrgOwner,
      isOpsManager,
      isOpsLead,
      isAgent,

      canDownload,
      canUpload,
      canManage,
      canAssignRoles,

      canViewDash,
      canViewReports,
      canShare,
      canSetFollowUp,

      orgName,
      orgPlan,
    }),
    [
      user,
      token,
      loading,
      role,

      isSuperAdmin,
      isOrgOwner,
      isOpsManager,
      isOpsLead,
      isAgent,

      canDownload,
      canUpload,
      canManage,
      canAssignRoles,

      canViewDash,
      canViewReports,
      canShare,
      canSetFollowUp,

      orgName,
      orgPlan,
    ]
  )

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Outfit, sans-serif',
          background: '#F8FAFC',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '4px solid #E2E8F0',
              borderTop: '4px solid #2563EB',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />

          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0F172A',
            }}
          >
            Loading CRM...
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}