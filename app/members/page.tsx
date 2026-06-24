'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '@/components/page-context'
import { NewMemberForm } from '@/components/members/new-member-form'
import { MembersList } from '@/components/members/members-list'

export default function MembersPage() {
  const { setPageInfo } = usePageTitle()
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    setPageInfo('Usuários', 'Cadastrar e consultar usuários da biblioteca')
  }, [setPageInfo])

  const handleSuccess = useCallback(() => {
    setShowForm(false)
    setRefreshTrigger((n) => n + 1)
  }, [])

  if (showForm) {
    return (
      <div className="space-y-8">
        <NewMemberForm
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <MembersList
        refreshTrigger={refreshTrigger}
        onNewUser={() => setShowForm(true)}
      />
    </div>
  )
}
