import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'
import { Container, Main, Section } from '@/components/craft'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
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
