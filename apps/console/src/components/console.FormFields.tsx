import { useStore } from '@tanstack/react-store'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import type { Icon } from '@tabler/icons-react'
import type { LucideIcon } from 'lucide-react'
import { useFieldContext, useFormContext } from '@/hooks/console.form'
import { Loader } from '@/routes/_authed/-components/loader'

interface SubmitButtonProps {
  label?: string
  icon?: Icon | LucideIcon
}
export function SubmitButton(props: SubmitButtonProps) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit}>
          {props.icon && <props.icon />}
          {isSubmitting ? <Loader /> : props.label}
        </Button>
      )}
    </form.Subscribe>
  )
}

interface InputFieldProps {
  label: string
  placeholder?: string
}
export function InputField(props: InputFieldProps) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div className="my-4">
      <Label className="mb-2">{props.label}</Label>
      <Input
        value={field.state.value}
        placeholder={props.placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {
        // field.state.meta.isTouched &&
        <ErrorMessages errors={errors} />
      }
    </div>
  )
}

// INTERNAL
function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === 'string' ? error : error.message}
          className="text-red-500 mt-1 font-bold"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  )
}
