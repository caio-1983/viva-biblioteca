'use client'

import { useEffect, useRef, useState } from 'react'
import { usePageTitle } from '@/components/page-context'
import { NewMemberForm } from '@/components/members/new-member-form'
import { MembersList } from '@/components/members/members-list'

export default function MembersPage() {
  const { setPageInfo } = usePageTitle()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPageInfo('Usuários', 'Cadastrar e consultar usuários da biblioteca')
  }, [setPageInfo])

  const handleMemberCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleNewUser = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      const input = document.getElementById('nomeCompleto') as HTMLInputElement | null
      input?.focus()
    }, 400)
  }

  return (
    <div className="space-y-8">
      <div ref={formRef}>
        <NewMemberForm onSuccess={handleMemberCreated} />
      </div>
      <MembersList refreshTrigger={refreshTrigger} onNewUser={handleNewUser} />
    </div>
  )
}
