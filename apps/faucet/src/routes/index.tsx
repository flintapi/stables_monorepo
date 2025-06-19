import { createFileRoute } from '@tanstack/react-router'
import { Container, Main, Section } from '@/components/craft'
import { ModeToggle } from '@/components/mode-toggle'
import { AddressInput } from '@/components/ui/addess-input'
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@/components/magicui/terminal'
import cNGNxAssetchain from '@/assets/cNGN x Assetchain.svg?url'
import cNGNxBantu from '@/assets/cNGN x Bantu.svg?url'
import cNGNxBase from '@/assets/cNGN x Base.svg?url'
import cNGNxBSC from '@/assets/cNGN x BSC.svg?url'
import cNGNxEthereum from '@/assets/cNGN x Ethereum.svg?url'
import cNGNxPolygon from '@/assets/cNGN x Polygon.svg?url'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <Main className="h-screen grid">
      <Section className="grid items-center gap-4 grid-cols-1 lg:grid-cols-2">
        <Container className="w-full grid items-center">
          <div className="grid justify-center lg:justify-end">
            <h1 className="text-2xl md:text-5xl font-semibold font-sans">
              cNGN Testnet Faucet
            </h1>
            <span className="text-black dark:text-white/65">
              Get testnet cNGN in your wallet to experiment with
            </span>
            <AddressInput
              className="mb-8"
              placeholder="Enter valid network address"
            />
            <TerminalUse />
          </div>
        </Container>
        <Container className="w-full items-center justify-center lg:justify-start">
          <div className="grid justify-end grid-cols-2 gap-8 lg:w-[50%]">
            {[
              cNGNxAssetchain,
              cNGNxBantu,
              cNGNxBase,
              cNGNxBSC,
              cNGNxEthereum,
              cNGNxPolygon,
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-full size-40 aspect-square bg-transparent items-center justify-center p-2"
              >
                <img src={item} className="size-full object-center" />
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Footer />
    </Main>
  )
}

function TerminalUse() {
  return (
    <Terminal>
      <TypingAnimation>
        &gt; flint@latest fund -a 0xaddress -n base-sepolia
      </TypingAnimation>

      <AnimatedSpan delay={3000} className="text-green-500">
        <span>✔ Address funded.</span>
      </AnimatedSpan>
      <AnimatedSpan delay={4000} className="text-green-500">
        <span>✔ 1,000,000cNGN test tokens.</span>
      </AnimatedSpan>
    </Terminal>
  )
}

function Footer() {
  return (
    <Section className="md:!p-0 !p-0 !px-4 grid items-center">
      <Container className="md:!p-0 !p-0 w-full flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-foreground">Powered by</p>
          <a href="https://flintapi.io" target="_blank">
            <img src="/icon.png" className="object-cover size-6 mx-3" />
          </a>
          <p>FlintAPI Ltd</p>
        </div>
        <ModeToggle />
      </Container>
    </Section>
  )
}
