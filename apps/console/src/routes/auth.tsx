import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { Container, Main, Section } from '@/components/craft'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
  validateSearch: z
    .object({
      redirect: z.string().optional(),
    })
    .optional(),
})

function RouteComponent() {
  return (
    <Main>
      <Section>
        <Container className="max-w-xl">
          <div>
            <LoginForm />
          </div>
        </Container>
      </Section>
    </Main>
  )
}
