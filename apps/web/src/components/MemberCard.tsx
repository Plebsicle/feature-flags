"use client"

import { useState } from "react"
import { Edit2, Trash2, Check, X } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EditRoleDropdown } from "./EditRoleDropdown"
import { Toaster, toast } from "react-hot-toast"

type UserRole = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface MemberDetails {
  id: string
  name: string
  email: string
  role: UserRole
}

interface MemberCardProps {
  member: MemberDetails
  onRoleUpdate: (memberId: string, newRole: UserRole) => Promise<void>
  onDelete: (memberId: string) => void
  isUpdating?: boolean
}

export function MemberCard({ member, onRoleUpdate, onDelete, isUpdating = false }: MemberCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(member.role)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (selectedRole === member.role) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    const promise = onRoleUpdate(member.id, selectedRole)

    toast.promise(promise, {
      loading: "Updating role...",
      success: () => {
        setIsEditing(false)
        return "Role updated successfully!"
      },
      error: () => {
        // console.error("Failed to update role:", err)
        setSelectedRole(member.role)
        return "Failed to update role."
      }
    }).finally(() => {
      setIsLoading(false)
    })
  }

  const handleCancel = () => {
    setSelectedRole(member.role)
    setIsEditing(false)
  }

  return (
    <>
      <Toaster />
      <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground text-sm truncate">
                    {member.email}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <EditRoleDropdown
                          value={selectedRole}
                          onChange={setSelectedRole}
                          disabled={member.role === "OWNER"}
                        />
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isLoading}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 rounded-md shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="h-8 px-3 rounded-md border-border text-foreground hover:bg-muted"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium uppercase border ${
                          member.role === "OWNER" 
                            ? "bg-primary/10 text-primary border-primary/20" 
                            : member.role === "ADMIN"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : member.role === "MEMBER"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              {!isEditing && member.role !== "OWNER" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isUpdating}
                    className="h-8 w-8 p-0 rounded-md border-border text-foreground hover:bg-muted"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(member.id)}
                    disabled={isUpdating}
                    className="h-8 w-8 p-0 rounded-md border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 