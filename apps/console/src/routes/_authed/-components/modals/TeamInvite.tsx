import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { useConsoleForm } from '@/hooks/console.form'
import { authClient } from '@/lib/auth-client'
import { getTeamQueryOptions } from '@/lib/api-client'

interface TeamInviteModalProps {}
const TeamInviteModal = (_: TeamInviteModalProps) => {
  const modal = useModal()
  const queryClient = useQueryClient()

  const form = useConsoleForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onChange: z.object({
        email: z.string().email(),
      }),
    },
    onSubmit: async ({ value }) => {
      console.log('Invite email', value)
      const { data, error } = await authClient.organization.inviteMember({
        email: value.email,
        role: 'member',
        resend: true,
      })

      if (error) {
        return toast.error('Failed to send invite', {
          description: error.message,
        })
      }

      queryClient.invalidateQueries({ queryKey: getTeamQueryOptions.queryKey })
      toast.success('Invite sent successfully', {
        description: `Invite sent to ${data.email} with role ${data.role}`,
      })
      modal.hide()
    },
  })

  return (
    <Credenza
      open={modal.visible}
      onOpenChange={(open) => (open ? modal.show() : modal.hide())}
    >
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Invite Team Member</CredenzaTitle>
          <CredenzaDescription>
            Invite a team member to your organization.
          </CredenzaDescription>
        </CredenzaHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <CredenzaBody>
            <form.AppField name="email">
              {(field) => <field.InputField label="Email address" />}
            </form.AppField>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </CredenzaClose>
            <form.AppForm>
              <form.SubmitButton label="Invite" />
            </form.AppForm>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
}

export default NiceModal.create(TeamInviteModal)
