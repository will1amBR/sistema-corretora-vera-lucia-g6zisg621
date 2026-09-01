import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User, Client } from '@/types'
import { getClientByPortalToken } from '@/services/clients'

interface AuthContextType {
  user: User | null
  clientPortal: Client | null
  isAdmin: boolean
  isLoading: boolean
  loginAsAdmin: (email?: string, password?: string) => Promise<{ error: any }>
  logout: () => void
  loginClientWithToken: (token: string) => Promise<{ client: Client | null; error: any }>
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  confirmPasswordReset: (token: string, password: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(pb.authStore.model as unknown as User)
  const [clientPortal, setClientPortal] = useState<Client | null>(() => {
    const saved = localStorage.getItem('vera_client_portal')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (_) {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model as unknown as User)
    })

    // Check URL params for portal_token
    const params = new URLSearchParams(window.location.search)
    const portalTokenFromUrl = params.get('portal_token')
    if (portalTokenFromUrl) {
      loginClientWithToken(portalTokenFromUrl)
    }

    setIsLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const loginAsAdmin = async (email = 'william@korenambiental.com', password = 'Skip@Pass') => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      setUser(authData.record as unknown as User)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setClientPortal(null)
    localStorage.removeItem('vera_client_portal')
  }

  const loginClientWithToken = async (token: string) => {
    try {
      const client = await getClientByPortalToken(token)
      if (client) {
        setClientPortal(client)
        localStorage.setItem('vera_client_portal', JSON.stringify(client))
        return { client, error: null }
      }
      return { client: null, error: new Error('Token inválido ou expirado') }
    } catch (error) {
      return { client: null, error }
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const confirmPasswordReset = async (token: string, password: string) => {
    try {
      await pb.collection('users').confirmPasswordReset(token, password, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const isAdmin = Boolean(user && (!user.role || user.role === 'admin'))

  return (
    <AuthContext.Provider
      value={{
        user,
        clientPortal,
        isAdmin,
        isLoading,
        loginAsAdmin,
        logout,
        loginClientWithToken,
        requestPasswordReset,
        confirmPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
