import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/organizations')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/organizations"!</div>
}
