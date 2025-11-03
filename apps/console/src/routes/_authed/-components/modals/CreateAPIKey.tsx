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
import { getOrganizationApiKeysQueryOptions } from '@/lib/api-client'
import { generateWebhookSecret } from '@/lib/utils'
// import { generateWebhookSecret } from '@flintapi/shared/Utils'

interface CreateAPIKeyModalProps {
  organizationId: string
}
const CreateAPIKeyModal = ({ organizationId }: CreateAPIKeyModalProps) => {
  const modal = useModal()
  const queryClient = useQueryClient()

  const form = useConsoleForm({
    defaultValues: {
      name: '',
      webhookUrl: '',
    },
    validators: {
      onChange: z.object({
        name: z.string().min(3),
        webhookUrl: z.string().url(),
      }),
    },
    onSubmit: async ({ value }) => {
      console.log('Crate api key', value)
      const { data, error } = await authClient.apiKey.create({
        name: value.name,
        metadata: {
          organizationId,
          webhookUrl: value.webhookUrl,
          webhookSecret: generateWebhookSecret(),
        },
      })

      if (error) {
        return toast.error('Failed to create api key', {
          description: error.message,
        })
      }

      sessionStorage.setItem('apiKey', data?.key)

      queryClient.invalidateQueries({
        queryKey: getOrganizationApiKeysQueryOptions(organizationId).queryKey,
      })
      toast.success('API Key created', {
        description: `All permissions are enabled by default`,
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
            <form.AppField name="name">
              {(field) => <field.InputField label="API Key name" />}
            </form.AppField>
            <form.AppField name="webhookUrl">
              {(field) => (
                <field.InputField
                  label="Webhook URL"
                  placeholder="Input Webhook URL"
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
              <form.SubmitButton label="Create key" />
            </form.AppForm>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
}

export default NiceModal.create(CreateAPIKeyModal)
