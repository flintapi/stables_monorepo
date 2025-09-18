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
import { defaultOrganizationLogo } from '@/lib/utils'
import {
  getOrganizationsQueryOptions,
  getTeamQueryOptions,
} from '@/lib/api-client'

interface CreateOrganizationModalProps {}
const CreateOrganizationModal = NiceModal.create(
  (_: CreateOrganizationModalProps) => {
    const modal = useModal()
    const queryClient = useQueryClient()

    const form = useConsoleForm({
      defaultValues: {
        name: '',
        companyDomain: '',
      },
      validators: {
        onChange: z.object({
          name: z.string().min(4).max(1024),
          companyDomain: z.string().url(),
        }),
      },
      onSubmit: async ({ value }) => {
        console.log('Create org details', value)
        const { error } = await authClient.organization.create({
          name: value.name,
          slug: value.name.toLowerCase().split(' ').join('-'),
          logo: defaultOrganizationLogo,
          keepCurrentActiveOrganization: false,
        })

        if (error) {
          console.log('Error creating organization', error)
          return toast.error('Failed to create organization', {
            description: error.message,
          })
        }

        toast.success('Organization created successfully')
        queryClient.invalidateQueries({
          queryKey: getTeamQueryOptions.queryKey,
        })
        queryClient.invalidateQueries({
          queryKey: getOrganizationsQueryOptions.queryKey,
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
            <CredenzaTitle>Create your organization</CredenzaTitle>
            <CredenzaDescription>
              Create organzation to get started.
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
                {(field) => <field.InputField label="Organization name" />}
              </form.AppField>
              <form.AppField name="companyDomain">
                {(field) => (
                  <field.InputField
                    label="Organization domain"
                    placeholder="https://acme.co"
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
                <form.SubmitButton label="Create" />
              </form.AppForm>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    )
  },
)

export const showCreateOrgModal = () => NiceModal.show(CreateOrganizationModal)
