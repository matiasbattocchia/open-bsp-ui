import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/integrations/whatsapp/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/integrations/whatsapp/new"!</div>
}
