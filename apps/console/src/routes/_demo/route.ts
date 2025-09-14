import { createFileRoute } from "@tanstack/react-router";
import { Container } from '@/components/craft';

export const Route = createFileRoute("/_demo")({
  beforeLoad: () => {
    throw new Error("Routes are not accessible")
  },
})
