import { z } from 'zod'
import { Github, GithubIcon, LoaderCircle } from 'lucide-react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppForm } from '@/hooks/demo.form'
import { authClient } from '@/lib/auth-client'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      console.log(value, 'Submitted value')
      router.navigate({ to: '/overview' })
      // form.reset()
    },
  })

  const query = useSearch({ from: '/auth' })

  return (
    <div
      className={cn('flex flex-col gap-6 animate-fade', className)}
      {...props}
    >
      <div className="mx-auto">
        <div className="flex items-center justify-center gap-2">
          <img src={`/icon.png`} alt="Logo" className="object-cover size-8" />
          <h2 className="font-bold font-sans text-2xl">FlintAPI Console.</h2>
        </div>
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>
            Login with your Github or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={async () => {
                    const data = await authClient.signIn.social({
                      provider: 'github',
                      callbackURL:
                        typeof query !== 'undefined'
                          ? query.redirect
                          : 'http://localhost:3000/overview',
                      // disableRedirect: true,
                    })
                    console.log('Github data', data.data?.url)
                  }}
                >
                  <GithubIcon className="size-5" />
                  Login with Github
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    console.log('Clicked google login button')
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <form.Field
                    name="email"
                    children={(field) => (
                      <>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id={field.name}
                          type="email"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="merchant@flintapi.io"
                          required
                        />
                      </>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <form.Field
                    name="password"
                    children={(field) => (
                      <>
                        <div className="flex items-center">
                          <Label htmlFor="password">Password</Label>
                          <a
                            href="#"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </a>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                          placeholder="Enter a strong password"
                        />
                      </>
                    )}
                  />
                </div>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      className="w-full items-center justify-center"
                      disabled={!canSubmit}
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="animate-spin size-4" />
                      ) : (
                        'Login'
                      )}
                    </Button>
                  )}
                />
              </div>
              {/*<div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <a href="#" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>*/}
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
