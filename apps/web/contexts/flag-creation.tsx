"use client"
import {RolloutConfig} from '@repo/types/rollout-config'
import { environment_type, flag_type, rollout_type } from '@repo/db/client'
import {Condition} from '@repo/types/rule-config'
import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Types
export type FlagType = flag_type

interface values {
  "value" : any,
}

export interface FlagCreationState {
  // Step 1: Details
  name: string
  key: string
  description: string
  flag_type: FlagType
  tags: string[]
  
  // Step 2: Environments
  environments: {
    environment : environment_type,
    value : values,
    default_value : values,
  }
  
  // Step 3: Rules
  rules: {
    name : string,
    description? : string,
    conditions : Condition[]
  }
  
  // Step 4: Rollout
  rollout: {
    type : rollout_type,
    config : RolloutConfig
  }
  
  // Mode tracking
  isCreatingEnvironmentOnly: boolean
  flag_id?: string
}

// Action types
type FlagCreationAction =
  | { type: 'UPDATE_DETAILS'; payload: Partial<Pick<FlagCreationState, 'name' | 'key' | 'description' | 'flag_type' | 'tags'>> }
  | { type: 'UPDATE_ENVIRONMENTS'; payload: Partial<FlagCreationState['environments']> }
  | { type: 'UPDATE_RULES'; payload: Partial<FlagCreationState['rules']> }
  | { type: 'UPDATE_ROLLOUT'; payload: Partial<FlagCreationState['rollout']> }
  | { type: 'HYDRATE_FROM_EXISTING_FLAG'; payload: Partial<FlagCreationState> }
  | { type: 'SET_ENVIRONMENT_CREATION_MODE'; payload: boolean }
  | { type: 'RESET' }

// Initial state
const initialState: FlagCreationState = {
  name: '',
  key: '',
  description: '',
  flag_type: 'BOOLEAN',
  tags: [],
  environments: {
    environment: 'DEV',
    value: { value: false },
    default_value: { value: false }
  },
  rules: {
    name: '',
    description: '',
    conditions: []
  },
  rollout: {
    type: 'PERCENTAGE',
    config: {
      percentage: 0,
      startDate: new Date(),
      endDate: new Date()
    }
  },
  isCreatingEnvironmentOnly: false,
  flag_id: undefined
}

// Reducer
function flagCreationReducer(state: FlagCreationState, action: FlagCreationAction): FlagCreationState {
  switch (action.type) {
    case 'UPDATE_DETAILS':
      return { ...state, ...action.payload }
    case 'UPDATE_ENVIRONMENTS':
      return { ...state, environments: { ...state.environments, ...action.payload } }
    case 'UPDATE_RULES':
      return { ...state, rules: { ...state.rules, ...action.payload } }
    case 'UPDATE_ROLLOUT':
      return { ...state, rollout: { ...state.rollout, ...action.payload } }
    case 'HYDRATE_FROM_EXISTING_FLAG':
      return { ...state, ...action.payload }
    case 'SET_ENVIRONMENT_CREATION_MODE':
      return { ...state, isCreatingEnvironmentOnly: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
interface FlagCreationContextType {
  state: FlagCreationState
  updateDetails: (details: Partial<Pick<FlagCreationState, 'name' | 'key' | 'description' | 'flag_type' | 'tags'>>) => void
  updateEnvironments: (environments: Partial<FlagCreationState['environments']>) => void
  updateRules: (rules: Partial<FlagCreationState['rules']>) => void
  updateRollout: (rollout: Partial<FlagCreationState['rollout']>) => void
  hydrateFromExistingFlag: (flagData: Partial<FlagCreationState>) => void
  setEnvironmentCreationMode: (isCreatingEnvironmentOnly: boolean) => void
  reset: () => void
  submitFlag: () => Promise<void>
}

const FlagCreationContext = createContext<FlagCreationContextType | undefined>(undefined)

// Provider
export function FlagCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flagCreationReducer, initialState)

  const updateDetails = React.useCallback((details: Partial<Pick<FlagCreationState, 'name' | 'key' | 'description' | 'flag_type' | 'tags'>>) => {
    dispatch({ type: 'UPDATE_DETAILS', payload: details })
  }, [])

  const updateEnvironments = React.useCallback((environments: Partial<FlagCreationState['environments']>) => {
    dispatch({ type: 'UPDATE_ENVIRONMENTS', payload: environments })
  }, [])

  const updateRules = React.useCallback((rules: Partial<FlagCreationState['rules']>) => {
    dispatch({ type: 'UPDATE_RULES', payload: rules })
  }, [])

  const updateRollout = React.useCallback((rollout: Partial<FlagCreationState['rollout']>) => {
    dispatch({ type: 'UPDATE_ROLLOUT', payload: rollout })
  }, [])

  const hydrateFromExistingFlag = React.useCallback((flagData: Partial<FlagCreationState>) => {
    dispatch({ type: 'HYDRATE_FROM_EXISTING_FLAG', payload: flagData })
  }, [])

  const setEnvironmentCreationMode = React.useCallback((isCreatingEnvironmentOnly: boolean) => {
    dispatch({ type: 'SET_ENVIRONMENT_CREATION_MODE', payload: isCreatingEnvironmentOnly })
  }, [])

  const reset = React.useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const submitFlag = React.useCallback(async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    
    try {
      const response = await fetch(`${BACKEND_URL}/flag/createFlag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(state)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Flag created successfully:', result)
    } catch (error) {
      console.error('Error creating flag:', error)
      throw error
    }
  }, [state])

  return (
    <FlagCreationContext.Provider value={{
      state,
      updateDetails,
      updateEnvironments,
      updateRules,
      updateRollout,
      hydrateFromExistingFlag,
      setEnvironmentCreationMode,
      reset,
      submitFlag
    }}>
      {children}
    </FlagCreationContext.Provider>
  )
}

// Hook to use the context
export function useFlagCreation() {
  const context = useContext(FlagCreationContext)
  if (context === undefined) {
    throw new Error('useFlagCreation must be used within a FlagCreationProvider')
  }
  return context
}



