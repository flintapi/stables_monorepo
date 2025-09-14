import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import logo from '../../public/icon.png?url'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    console.log('App mounted')
    const initAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      if (!session) {
        router.navigate({ to: '/auth', replace: true })
      } else {
        router.navigate({ to: '/overview', replace: true })
      }
    }

    if (!isPending) {
      initAuth()
    }
  }, [isPending])

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-14 pointer-events-none animate-[bounce_3s_ease-in_infinite]"
          alt="logo"
        />
        <p>Authenticating...</p>
        <p className="text-xl text-gray-400">you will be redirected shortly</p>
        <p className="text-lg text-gray-400">
          If you are not redirected, please refresh the page
        </p>
      </header>
    </div>
  )
}
