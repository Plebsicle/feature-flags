"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import axios from 'axios'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"


interface User {
  id: string
  name: string
  email: string
  organizationName?: string
}

interface PartialSignupDetails {
  name?: string
  email?: string
  password?: string
  googleToken? : string
}

interface AuthContextType {
  user: User | null
  login: (email?: string, password?: string , googleToken? : string) => Promise<boolean>
  signup: (name?: string, email?: string, password?: string , googleToken? : string) => boolean // Phase 1
  completeSignup: (organizationName: string) => Promise<boolean> // Phase 2
  logout: () => void
  isLoading: boolean
  updateOrganization: (organizationName: string) => void
  partialSignupDetails: PartialSignupDetails | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [partialSignupDetails, setPartialSignupDetails] = useState<PartialSignupDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const updateOrganization = (organizationName: string) => {
    if (user) {
      const updatedUser = { ...user, organizationName }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const login = async (email? : string, password ?: string,googleToken? : string): Promise<boolean> => {
    setIsLoading(true)
    try {
          if(password){
            const response = await axios.post(`/${BACKEND_URL}/auth/emailSignin`,{
              email,password
            },{withCredentials:true});
            if(response.status === 200){
              // toast here
              // console.log('Signin Succesfull');
            }
            else{
              // console.log('Signin Failed');
            }
          }
          else{
            const response = await axios.post(`/${BACKEND_URL}/auth/googleSignin`,{
              googleId : googleToken
            },{withCredentials:true});
            if(response.status === 200){
              // toast here 
              // console.log('google sigin succesfull');
            }
            else{
              // console.log('google sigin failed');
            }
          }

      // setUser(mockUser)
      // localStorage.setItem("user", JSON.stringify(mockUser))
      return true
    } catch {
      return false
      // console.log('Signin Failed');
    } finally {
      setIsLoading(false)
    }
  }

  const signup =   (name?: string, email?: string, password? : string,googleToken? : string): boolean => {
    // Save partial details only
    setPartialSignupDetails({ name, email, password,googleToken })
    return true
  }

  const completeSignup = async (organizationName: string): Promise<boolean> => {
    if (!partialSignupDetails) return false
    setIsLoading(true)
    try {
      const { name, email, password,googleToken } = partialSignupDetails
      if(!password){
        const response = await axios.post(`/${BACKEND_URL}/auth/googleSignup`,{
          googleId : googleToken,orgName : organizationName
        },{withCredentials:true});
        if(response.status === 200){
          // Setup Toasts Here 
          // console.log("Signup Succesfull");
        }
        else{
          // console.log("Signup failed");

        }
      }
      else{
        const response = await axios.post(`/${BACKEND_URL}/auth/emailSignup`,{
          name , email , password , orgName : organizationName
        },{withCredentials:true});
        if(response.status === 200){
          // setup toasts here
          // console.log("Email sent  Successfully");
        }
        else{
          // console.log("Signup failed");
        }
      }
      setPartialSignupDetails(null);

      return true
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setPartialSignupDetails(null)
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        completeSignup,
        logout,
        isLoading,
        updateOrganization,
        partialSignupDetails,
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
