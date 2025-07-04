"use client"

import { useState } from "react"
import { Edit2, Trash2, Check, X } from "lucide-react"
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
      error: (err) => {
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
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {member.name}
                  </h3>
                  <p className="text-gray-600 text-sm truncate">
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="h-8 px-3"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${
                          member.role === "OWNER" 
                            ? "bg-purple-100 text-purple-700" 
                            : member.role === "ADMIN"
                            ? "bg-indigo-100 text-indigo-700"
                            : member.role === "MEMBER"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
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
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(member.id)}
                    disabled={isUpdating}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 h-8 w-8 p-0"
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