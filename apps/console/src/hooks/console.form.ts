import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { InputField, SubmitButton } from "@/components/console.FormFields"

const { formContext, fieldContext, useFieldContext, useFormContext} = createFormHookContexts()



const {useAppForm: useConsoleForm} = createFormHook({
  formComponents: {
    SubmitButton
  },
  fieldComponents: {
    InputField
  },
  formContext,
  fieldContext
})

export {useConsoleForm, useFormContext, useFieldContext}
