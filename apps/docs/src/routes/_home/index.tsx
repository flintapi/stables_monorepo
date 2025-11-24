import { Link, createFileRoute } from '@tanstack/react-router'
import { Image } from '@unpic/react'
import { Github, Linkedin, Twitter } from 'lucide-react'
import { FlickeringGrid } from '@/components/ui/flickering-grid-hero'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { Footer } from '@/components/ui/footer'
import { useTheme } from '@/components/theme-provider'
// import { Features } from '@/components/blocks/features-9'

export const Route = createFileRoute('/_home/')({ component: App })

function App() {
  return (
    <div className="min-h-screen dark:bg-black bg-slate-50">
      <section className="container relative p-6 h-[75vh] overflow-hidden rounded-3xl mx-auto">
        <div className="grid h-full grid-cols-3">
          <div className="grid items-center col-span-3 lg:col-span-2">
            <div className="space-y-6 z-30">
              <h2 className="text-2xl text-center lg:text-left lg:text-5xl text-balance font-semibold font-sans">
                API-First Infrastructure for
                <br /> Stablecoins
              </h2>
              <div className="flex gap-2 items-center justify-center lg:justify-start lg:gap-5">
                <Button size="lg" variant="default" asChild>
                  <Link to="/docs/$">Getting started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://console.flintapi.io">Create account</a>
                </Button>
              </div>
            </div>
          </div>
          <div className="col-span-3">
            <Image
              alt="hero-image"
              width={1628}
              height={1044}
              decoding="async"
              // data-nimg="1"
              className="absolute z-20 text-transparent top-[460px] left-[20%] max-w-[1200px] rounded-xl border-2 lg:top-[400px] max-xl:top-[500px] animate-in fade-in duration-400"
              // style="color:transparent"
              src="/hero-preview.png"
            />
          </div>
        </div>
        <FlickeringGridDemo />
      </section>

      {/*<section className="py-16 px-6 max-w-7xl mx-auto">
        <Features />
      </section>*/}
      <div className="w-full mt-[20%]">
        <Footer
          logo={
            <Image
              src="/icon.png"
              layout="constrained"
              width={30}
              height={30}
              className="h-10 w-10"
            />
          }
          brandName="FlintAPI Tech Ltd."
          socialLinks={[
            {
              icon: <Twitter className="h-5 w-5" />,
              href: 'https://x.com/flintApi',
              label: 'Twitter',
            },
            {
              icon: <Linkedin className="h-5 w-5" />,
              href: 'https://www.linkedin.com/company/flint-api/',
              label: 'GitHub',
            },
          ]}
          mainLinks={[
            { href: '/docs', label: 'Documentation' },
            {
              href: 'https://stables.flintapi.io/reference',
              label: 'API Reference',
            },
            // { href: '/blog', label: 'Blog' },
            { href: 'mailto:support@flintapi.io', label: 'Contact' },
          ]}
          legalLinks={[
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms', label: 'Terms' },
          ]}
          copyright={{
            text: '© 2025 FlintAPI Tech Ltd.',
            license: 'All rights reserved',
          }}
        />
      </div>
    </div>
  )
}

// Base64 encoded SVG
const FLINT_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1NSIgaGVpZ2h0PSI1MiIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTU1IDExQTExIDExIDAgMCAwIDQ0IDBIMjl2MzJhMjAgMjAgMCAwIDAgMjAgMjAgNiA2IDAgMCAwIDYtNnoiLz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMjYgMzlhMTMgMTMgMCAwIDEtMjYgMFYyMEEyMCAyMCAwIDAgMSAyMCAwaDZ6Ii8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMTMiIHgyPSIxMyIgeTE9IjAiIHkyPSI1Ni41IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iI0VFNDc1MSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VERjEyOCIgc3RvcC1vcGFjaXR5PSIuOSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg==`

// maskstyles
const maskStyle = {
  WebkitMaskImage: `url('${FLINT_LOGO_BASE64}')`,
  WebkitMaskSize: '30vw',
  WebkitMaskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  maskImage: `url('${FLINT_LOGO_BASE64}')`,
  maskSize: '30vw',
  maskPosition: 'center',
  maskRepeat: 'no-repeat',
} as const

// grid configuration for background and logo
const GRID_CONFIG = {
  background: {
    color: '#EE4751',
    maxOpacity: 0.15,
    flickerChance: 0.12,
    squareSize: 4,
    gridGap: 4,
  },
  logoDark: {
    color: '#EDF128',
    maxOpacity: 0.85,
    flickerChance: 0.18,
    squareSize: 4,
    gridGap: 6,
  },
  logoLight: {
    color: '#000000',
    maxOpacity: 0.85,
    flickerChance: 0.18,
    squareSize: 4,
    gridGap: 6,
  },
} as const

const FlickeringGridDemo = () => {
  const isMobile = useIsMobile()
  const { theme } = useTheme()

  return (
    <div className="flex w-full h-full">
      <FlickeringGrid
        className={`absolute inset-0 z-0 [mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] motion-safe:animate-pulse`}
        {...GRID_CONFIG.background}
      />
      <FlickeringGrid
        className={`absolute inset-0 z-0 -translate-x-[30vw] [mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] motion-safe:animate-pulse`}
        {...GRID_CONFIG.background}
      />
      <div
        className="absolute inset-0 z-0 -translate-x-[15vw] translate-y-[15vh] lg:-translate-y-[4vh] lg:translate-x-[16vw] motion-safe:animate-fade-in border-1 border-gray-200"
        style={{
          ...maskStyle,
          ...(isMobile && { maskSize: '30vh', WebkitMaskSize: '30vw' }),
          animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        <FlickeringGrid
          {...(theme === 'dark' ? GRID_CONFIG.logoDark : GRID_CONFIG.logoLight)}
        />
      </div>
    </div>
  )
}
