import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import Avatar from "@/components/Avatar";
import { useAgent, useUpdateAgent } from "@/queries/useAgents";

export const Route = createFileRoute("/_auth/agents/$agentId")({
  component: AgentDetails,
});

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "active":
      return <span className={`${base} bg-green-100 text-green-800`}>Activo</span>;
    case "inactive":
      return <span className={`${base} bg-red-100 text-red-800`}>Inactivo</span>;
    case "draft":
      return <span className={`${base} bg-yellow-100 text-yellow-800`}>Draft</span>;
    case "pending":
      return <span className={`${base} bg-blue-100 text-blue-800`}>Pendiente</span>;
    default:
      return <span className={`${base} bg-muted/10 text-muted-foreground`}>{status}</span>;
  }
}

function AgentDetails() {
  const { agentId } = Route.useParams();
  const { data: agent } = useAgent(agentId);
  const updateAgent = useUpdateAgent();

  if (!agent) return null;

  const status = agent.ai
    ? agent.extra?.mode || "active"
    : agent.extra?.invitation?.status === "pending"
    ? "pending"
    : "active";

  async function changeStatus(newStatus: string) {
    if (!agent) return;

    if (agent.ai) {
      await updateAgent.mutateAsync({ id: agent.id, extra: { ...(agent.extra || {}), mode: newStatus } });
    } else {
      const active = newStatus === "active";
      await updateAgent.mutateAsync({ id: agent.id, extra: { ...(agent.extra || {}), active } });
    }
  }

  const aiExtra = agent.ai ? agent.extra : null;

  return (
    <>
      <SectionHeader title={agent.name} />

      <SectionBody>
        {/* Header with Avatar and Status */}
        <div className="flex items-start gap-4 pb-4 border-b">
          <Avatar
            src={agent.picture}
            fallback={agent.name?.substring(0, 2).toUpperCase()}
            size={72}
            className="bg-primary/10 text-primary"
          />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{agent.name}</h2>
              <StatusBadge status={status} />
            </div>

            {agent.ai && aiExtra?.description && (
              <p className="text-sm text-muted-foreground mb-3">{aiExtra.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                className="primary text-sm px-3 py-1"
                onClick={() => void changeStatus("active")}
                disabled={updateAgent.isPending}
              >
                Activar
              </button>
              <button
                className="destructive text-sm px-3 py-1"
                onClick={() => void changeStatus("inactive")}
                disabled={updateAgent.isPending}
              >
                Desactivar
              </button>
              {agent.ai && (
                <button
                  className="outline text-sm px-3 py-1"
                  onClick={() => void changeStatus("draft")}
                  disabled={updateAgent.isPending}
                >
                  Draft
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Agent Details */}
        {agent.ai && aiExtra && (
          <>
            {/* System Prompt / Instructions */}
            {(aiExtra.instructions || aiExtra.prompt) && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">System Prompt</h3>
                <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {aiExtra.instructions || aiExtra.prompt}
                </div>
              </div>
            )}

            {/* Role */}
            {aiExtra.role && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Rol</h3>
                <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                  {aiExtra.role}
                </div>
              </div>
            )}

            {/* Model Configuration */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {aiExtra.model && (
                <SectionItem
                  title="Modelo"
                  description={aiExtra.model}
                />
              )}
              {aiExtra.temperature !== undefined && (
                <SectionItem
                  title="Temperatura"
                  description={aiExtra.temperature.toString()}
                />
              )}
              {aiExtra.api_url && (
                <SectionItem
                  title="API URL"
                  description={aiExtra.api_url}
                />
              )}
              {aiExtra.api_key && (
                <SectionItem
                  title="API Key"
                  description={aiExtra.api_key.substring(0, 20) + "..."}
                />
              )}
              {aiExtra.protocol && (
                <SectionItem
                  title="Protocolo"
                  description={aiExtra.protocol}
                />
              )}
              {aiExtra.max_tokens && (
                <SectionItem
                  title="Máx Tokens"
                  description={aiExtra.max_tokens.toString()}
                />
              )}
              {aiExtra.max_messages && (
                <SectionItem
                  title="Máx Mensajes"
                  description={aiExtra.max_messages.toString()}
                />
              )}
              {aiExtra.thinking && (
                <SectionItem
                  title="Thinking"
                  description={aiExtra.thinking}
                />
              )}
              {aiExtra.assistant_id && (
                <SectionItem
                  title="Assistant ID"
                  description={aiExtra.assistant_id}
                />
              )}
              {aiExtra.send_inline_files_up_to_size_mb && (
                <SectionItem
                  title="Archivos hasta"
                  description={`${aiExtra.send_inline_files_up_to_size_mb} MB`}
                />
              )}
            </div>

            {/* Toolkits */}
            {aiExtra.toolkits && aiExtra.toolkits.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Herramientas ({aiExtra.toolkits.length})</h3>
                <div className="space-y-2">
                  {aiExtra.toolkits.map((toolkit: any, idx: number) => (
                    <div key={idx} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <div className="font-medium text-foreground">{toolkit.name}</div>
                      {toolkit.tools && toolkit.tools.length > 0 && (
                        <div className="text-xs mt-1">
                          {toolkit.tools.map((tool: any, toolIdx: number) => (
                            <div key={toolIdx}>• {tool.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Tools (for backward compatibility) */}
            {aiExtra.tools && aiExtra.tools.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Herramientas ({aiExtra.tools.length})</h3>
                <div className="space-y-2">
                  {aiExtra.tools.map((tool: any, idx: number) => (
                    <div key={idx} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <div className="font-medium text-foreground">{tool.provider}</div>
                      <div>Tipo: {tool.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Human Agent Details */}
        {!agent.ai && agent.extra && (
          <div className="mt-6">
            <SectionItem
              title="Rol"
              description={agent.extra.role || "user"}
            />
            {agent.extra.invitation?.status === "pending" && (
              <SectionItem
                title="Email"
                description={agent.extra.invitation.email}
              />
            )}
          </div>
        )}

        {/* General Info */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>ID:</strong> {agent.id}</div>
            <div><strong>Tipo:</strong> {agent.ai ? "AI" : "Humano"}</div>
          </div>
        </div>
      </SectionBody>
    </>
  );
}
