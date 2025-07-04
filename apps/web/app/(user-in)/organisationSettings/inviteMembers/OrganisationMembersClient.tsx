"use client"

import { useState } from "react"
import { UserPlus, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberCard } from "@/components/MemberCard"
import { InviteMembersModal } from "@/components/InviteMembersModal"
import { Toaster, toast } from "react-hot-toast"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

type UserRole = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface MemberDetails {
  id: string
  name: string
  email: string
  role: UserRole
}

interface OrganisationMembersClientProps {
  initialMembers: MemberDetails[]
}

export function OrganisationMembersClient({ initialMembers }: OrganisationMembersClientProps) {
  const [members, setMembers] = useState<MemberDetails[]>(initialMembers)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRoleUpdate = async (memberId: string, newRole: UserRole) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`${BACKEND_URL}/organisation/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          memberId,
          role: newRole
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update role')
      }

      // Update the local state
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      )

      // console.log('Role updated successfully')
    } catch (error) {
      // console.error('Error updating role:', error)
      throw error // Re-throw so the component can handle it
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMemberDelete = async (memberId: string, memberRole: UserRole) => {
    // Don't allow deletion of OWNER users
    if (memberRole === 'OWNER') {
      toast.error('Cannot delete organization owner.')
      return
    }

    const deleteAction = async () => {
      setIsUpdating(true)
      try {
        const response = await fetch(`/${BACKEND_URL}/auth/member/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to delete member')
        }

        // Remove from local state after successful API call
        setMembers(prevMembers =>
          prevMembers.filter(member => member.id !== memberId)
        )
        
        toast.success('Member removed successfully.')
      } catch (error) {
        // console.error('Error deleting member:', error)
        toast.error('Failed to remove member. Please try again.')
      } finally {
        setIsUpdating(false)
      }
    }

    toast((t) => (
      <div className="flex flex-col items-start gap-3">
        <p className="font-semibold">Are you sure you want to remove this member?</p>
        <p className="text-sm text-gray-600">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={() => {
            deleteAction()
            toast.dismiss(t.id)
          }}>
            Remove
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </div>
    ))
  }

  const handleInviteMembers = async (emails: string[], role: UserRole) => {
    try {
      const response = await fetch(`/${BACKEND_URL}/auth/memberSignupSendInvitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          emails,
          memberRole : role
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to send invitations')
      }

      // console.log('Invitations sent successfully')
      
    } catch (error) {
      // console.error('Error sending invitations:', error)
      throw error // Re-throw so the modal can handle it
    }
  }

  return (
    <div className="space-y-6">
      <Toaster />
      {/* Members List Header */}
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({members.length})
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Manage roles and permissions for your team members
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Members Grid */}
      <div className="grid gap-4">
        {members.length === 0 ? (
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-slate-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No members found</h3>
              <p className="text-neutral-400 text-center mb-6">
                Start building your team by inviting members to your organization.
              </p>
              <Button 
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Your First Members
              </Button>
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onRoleUpdate={handleRoleUpdate}
              onDelete={(memberId) => handleMemberDelete(memberId, member.role)}
              isUpdating={isUpdating}
            />
          ))
        )}
      </div>

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMembers}
      />
    </div>
  )
} 