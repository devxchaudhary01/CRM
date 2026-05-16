import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API = axios.create({
  baseURL: 'https://crm-backend-4yp0.onrender.com/api',
  withCredentials: true,
})

const Ctx = createContext(null)

export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)

  const [token, setToken] = useState(() =>
    localStorage.getItem('crm2_token')
  )

  const [loading, setLoading] = useState(true)

  // Set Authorization Header
  useEffect(() => {

    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete API.defaults.headers.common['Authorization']
    }

  }, [token])

  // Get Current User
  useEffect(() => {

    if (!token) {
      setLoading(false)
      return
    }

    API.get('/auth/me')

      .then((res) => {
        setUser(res.data.user)
      })

      .catch(() => {

        localStorage.removeItem('crm2_token')

        delete API.defaults.headers.common['Authorization']

        setToken(null)

        setUser(null)
      })

      .finally(() => {
        setLoading(false)
      })

  }, [token])

  // Save Auth
  const _setAuth = (tok, usr) => {

    localStorage.setItem('crm2_token', tok)

    API.defaults.headers.common['Authorization'] = `Bearer ${tok}`

    setToken(tok)

    setUser(usr)
  }

  // Login
  const login = async (email, password) => {

    const { data } = await API.post('/auth/login', {
      email,
      password,
    })

    _setAuth(data.token, data.user)

    return data.user
  }

  // Register
  const register = async (payload) => {

    const { data } = await API.post('/auth/register', payload)

    if (data.token) {
      _setAuth(data.token, data.user)
    }

    return data
  }

  // Logout
  const logout = () => {

    localStorage.removeItem('crm2_token')

    delete API.defaults.headers.common['Authorization']

    setToken(null)

    setUser(null)
  }

  // Google Login Token
  const setTokenManually = (tok) => {

    localStorage.setItem('crm2_token', tok)

    API.defaults.headers.common['Authorization'] = `Bearer ${tok}`

    setToken(tok)
  }

  // Roles
  const role = user?.role || ''

  const isSuperAdmin = role === 'super_admin'

  const isOrgOwner = role === 'org_owner'

  const isOpsManager = role === 'ops_manager'

  const isOpsLead = role === 'ops_lead'

  const isAgent = ['c1', 'c2', 'c3'].includes(role)

  // Permissions
  const canDownload = [
    'org_owner',
    'ops_manager',
    'super_admin'
  ].includes(role)

  const canUpload = role === 'org_owner'

  const canManage = [
    'org_owner',
    'ops_manager',
    'super_admin'
  ].includes(role)

  const canAssignRoles = [
    'org_owner',
    'ops_manager',
    'super_admin'
  ].includes(role)

  const canViewDash = !isAgent

  const canViewReports = [
    'org_owner',
    'ops_manager',
    'super_admin'
  ].includes(role)

  const canShare = [
    'org_owner',
    'ops_manager',
    'super_admin'
  ].includes(role)

  const canSetFollowUp = [
    'org_owner',
    'super_admin'
  ].includes(role)

  const orgName = user?.organization?.name || ''

  const orgPlan = user?.organization?.plan || 'free'

  return (

    <Ctx.Provider
      value={{
        user,
        token,
        loading,

        login,
        register,
        logout,
        setTokenManually,

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
        role,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}