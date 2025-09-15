"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { signin, signup as signupAPI, getMe } from "@/lib/auth"

type UserRole = "party" | "admin"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status?: "active" | "pending" | "inactive"
  signature?: {
    url: string
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; status?: string }>
  logout: () => void
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string; status?: string }>
  resetPassword: (email: string) => Promise<boolean>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Only access localStorage after component is mounted
    if (typeof window !== 'undefined') {
      // Prehydrate user from localStorage to avoid redirect flicker on refresh
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as User
          setUser(normalizeUser(parsed))
        } catch {}
      }

      // Then validate token with backend and refresh user info
      const token = localStorage.getItem("auth_token")
      if (token) {
        getMe()
          .then((remoteUser) => {
            const normalized = normalizeUser(remoteUser as unknown as User)
            setUser(normalized)
            localStorage.setItem("user", JSON.stringify(normalized))
          })
          .catch(() => {
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user")
            setUser(null)
          })
          .finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; status?: string }> => {
    try {
      const data = await signin({ email, password })
      localStorage.setItem("auth_token", data.token)
      const normalized = normalizeUser(data.user as unknown as User)
      localStorage.setItem("user", JSON.stringify(normalized))
      setUser(normalized)
      return { success: true }
    } catch (err: any) {
      // Handle specific error responses
      if (err.response?.data?.status === 'pending_approval') {
        return { 
          success: false, 
          message: err.response.data.message,
          status: 'pending_approval'
        }
      }
      if (err.response?.data?.status === 'account_inactive') {
        return { 
          success: false, 
          message: err.response.data.message,
          status: 'account_inactive'
        }
      }
      return { 
        success: false, 
        message: err.response?.data?.message || "Login failed. Please try again."
      }
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string; status?: string }> => {
    try {
      const data = await signupAPI({ name, email, password })
      
      // Don't auto-login if account is pending approval
      if ((data as any).status === 'pending_approval') {
        return { 
          success: true, 
          message: (data as any).message,
          status: 'pending_approval'
        }
      }
      
      localStorage.setItem("auth_token", data.token)
      const normalized = normalizeUser(data.user as unknown as User)
      localStorage.setItem("user", JSON.stringify(normalized))
      setUser(normalized)
      return { success: true }
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.message || "Signup failed. Please try again."
      }
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    // Still fake for now unless you implement the backend
    console.warn("resetPassword not implemented.")
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        resetPassword,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

function normalizeUserRole(role: string): UserRole {
  const lower = (role || "").toLowerCase()
  return lower === "admin" ? "admin" : "party"
}

function normalizeUser(u: User): User {
  return { ...u, role: normalizeUserRole((u as unknown as { role: string }).role) }
}


// "use client"

// import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// type UserRole = "party" | "admin" | "user"

// interface User {
//   id: string
//   email: string
//   name: string
//   role: UserRole
// }

// interface AuthContextType {
//   user: User | null
//   login: (email: string, password: string) => Promise<boolean>
//   logout: () => void
//   signup: (name: string, email: string, password: string) => Promise<boolean>
//   resetPassword: (email: string) => Promise<boolean>
//   isLoading: boolean
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// // Demo users for authentication
// const DEMO_USERS = [
//   { id: "1", email: "party1@demo.com", password: "demo123", name: "John Smith", role: "party" as UserRole },
//   { id: "2", email: "party2@demo.com", password: "demo123", name: "Sarah Johnson", role: "party" as UserRole },
//   { id: "3", email: "admin@demo.com", password: "admin123", name: "Admin User", role: "admin" as UserRole },
// ]

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     // Check for stored user session
//     const storedUser = localStorage.getItem("user")
//     if (storedUser) {
//       setUser(JSON.parse(storedUser))
//     }
//     setIsLoading(false)
//   }, [])

//   const login = async (email: string, password: string): Promise<boolean> => {
//     const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password)

//     if (demoUser) {
//       const user = { id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role }
//       setUser(user)
//       localStorage.setItem("user", JSON.stringify(user))
//       return true
//     }

//     return false
//   }

//   const signup = async (name: string, email: string, password: string): Promise<boolean> => {
//     // Check if user already exists
//     if (DEMO_USERS.find((u) => u.email === email)) {
//       return false
//     }

//     // Create new user (in real app, this would be an API call)
//     const newUser = {
//       id: Date.now().toString(),
//       email,
//       name,
//       role: "party" as UserRole,
//     }

//     setUser(newUser)
//     localStorage.setItem("user", JSON.stringify(newUser))
//     return true
//   }

//   const resetPassword = async (email: string): Promise<boolean> => {
//     // Simulate password reset (in real app, this would send an email)
//     const userExists = DEMO_USERS.find((u) => u.email === email)
//     return !!userExists
//   }

//   const logout = () => {
//     setUser(null)
//     localStorage.removeItem("user")
//   }

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         login,
//         logout,
//         signup,
//         resetPassword,
//         isLoading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider")
//   }
//   return context
// }
