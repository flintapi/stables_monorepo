import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useConsoleForm } from '@/hooks/console.form'
import { FC } from 'react'
import { z } from 'zod'

export const VAForm: FC = () => {
  const vaForm = useConsoleForm({
    defaultValues: {
      rcNumber: '',
      businessName: '',
      emailAddress: '',
      phoneNumber: '',
      address: undefined,
      bvn: '',
      incorporationDate: '',
      dateOfBirth: '',
      metadata: undefined,
    },
    validators: {
      onChange: z.object({
        rcNumber: z.string(),
        businessName: z.string(),
        emailAddress: z.string().email(),
        phoneNumber: z.string().min(10).max(15),
        address: z.string().nullable(),
        bvn: z.string().min(11).max(11),
        incorporationDate: z.string().min(10).max(10),
        dateOfBirth: z.string().min(10).max(10),
        metadata: z.object({}),
      }),
    },
    onSubmit: async ({ value }) => {},
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dedicated virtual account details</CardTitle>
        <CardDescription>
          Submit the form to get a dedicated virtual account for cNGN
          auto-funding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            vaForm.handleSubmit()
          }}
          className="space-y-6"
        >
          <vaForm.AppField
            name="rcNumber"
            validators={{
              onSubmit: ({ value }) => {
                if (!value) return 'A valid name is required'

                return undefined
              },
            }}
          >
            {(field) => <field.InputField label="RC Number" />}
          </vaForm.AppField>

          <vaForm.AppForm>
            <vaForm.SubmitButton label="Update name" />
          </vaForm.AppForm>
        </form>
      </CardContent>
    </Card>
  )
}
