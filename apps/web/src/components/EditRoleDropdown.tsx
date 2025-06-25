"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserRole = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface EditRoleDropdownProps {
  value: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Member", 
  VIEWER: "Viewer",
  OWNER: "Owner"
}

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: "Full access to manage organization",
  MEMBER: "Can create and manage flags",
  VIEWER: "Read-only access to flags",
  OWNER: "Organization owner with full control"
}

export function EditRoleDropdown({ value, onChange, disabled = false }: EditRoleDropdownProps) {
  const availableRoles: UserRole[] = ["ADMIN", "MEMBER", "VIEWER"]

  return (
    <Select
      value={value}
      onValueChange={(newValue) => onChange(newValue as UserRole)}
      disabled={disabled}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem 
            key={role} 
            value={role}
          >
            <div className="flex flex-col">
              <span className="font-medium">{roleLabels[role]}</span>
              <span className="text-xs text-gray-500">
                {roleDescriptions[role]}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 