import { Container, Main, Section } from '@/components/craft'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { createFileRoute } from '@tanstack/react-router'
import { type CarouselApi } from '@/components/ui/carousel'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/_authed/otc-table')({
  component: RouteComponent,
})

function RouteComponent() {
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }

    api.on('select', () => {
      // Do something on select.
    })
  }, [api])

  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="">
          <Card className="bborder-dashed bg-gray-400/15 border-gray-500">
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-2xl">
                <Carousel setApi={setApi}>
                  <CarouselContent>
                    <CarouselItem>Slide 1</CarouselItem>
                    <CarouselItem>Slide 2</CarouselItem>
                    <CarouselItem>Slide 3</CarouselItem>
                  </CarouselContent>
                </Carousel>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </Main>
  )
}
