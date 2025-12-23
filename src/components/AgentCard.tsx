import Avatar from "@/components/Avatar";
import { type AgentRow } from "@/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export default function AgentCard({ agent }: { agent: AgentRow }) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-4 p-4 bg-card border rounded-lg shadow-sm hover:shadow-md cursor-pointer"
      onClick={() => navigate({ to: `/agents/${agent.id}` })}
      role="button"
    >
      <Avatar
        src={agent.picture}
        fallback={agent.name?.substring(0, 2).toUpperCase()}
        size={56}
        className="bg-muted text-muted-foreground"
      />

      <div className="flex-1">
        <div className="font-medium text-sm">{agent.name}</div>
        <div className="text-xs text-muted-foreground">
          {agent.extra?.role || (agent.ai ? "AI agent" : "Human agent")}
        </div>
      </div>

      <div className="text-xs px-2 py-1 rounded-full text-muted-foreground bg-muted/20">
        {agent.ai ? "AI" : "HUM"}
      </div>
    </div>
  );
}
