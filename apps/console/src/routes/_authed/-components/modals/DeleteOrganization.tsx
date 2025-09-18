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
import * as queryOptions from '@/lib/api-client'

interface DeleteOrganizationModalProps {
  organizationName: string
  organizationId: string
}
const DeleteOrganizationModal = NiceModal.create(
  (props: DeleteOrganizationModalProps) => {
    const modal = useModal()
    const queryClient = useQueryClient()

    const form = useConsoleForm({
      defaultValues: {
        name: '',
      },
      validators: {
        onChange: z.object({
          name: z.string().min(4).max(1024),
        }),
      },
      onSubmit: async ({ value }) => {
        console.log('Delete org details', value)

        if (value.name !== props.organizationName) {
          return toast.info('Organization name mismatch')
        }

        const { error } = await authClient.organization.delete({
          organizationId: props.organizationId,
        })

        if (error) {
          console.log('Error deleting organization', error)
          return toast.error('Failed to delete organization', {
            description: error.message,
          })
        }

        for (const option of Object.values(queryOptions)) {
          queryClient.invalidateQueries({
            queryKey: option.queryKey,
          })
        }

        toast.success('Organization deleted!')
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
            <CredenzaTitle>Delete your organization</CredenzaTitle>
            <CredenzaDescription>
              This is a parmanent action and will not be recoverable. Are you
              sure you want to delete your organization?
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
              <form.AppField name="name">
                {(field) => (
                  <field.InputField
                    label={`Enter organization name: ${props.organizationName}`}
                  />
                )}
              </form.AppField>
            </CredenzaBody>
            <CredenzaFooter>
              <CredenzaClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </CredenzaClose>
              <form.AppForm>
                <form.SubmitButton label="Yes, Delete" />
              </form.AppForm>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    )
  },
)

export const showDeleteOrgModal = ({
  organizationId,
  organizationName,
}: DeleteOrganizationModalProps) =>
  NiceModal.show(DeleteOrganizationModal, {
    organizationId,
    organizationName,
  })
