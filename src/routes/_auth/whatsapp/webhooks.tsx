import { useState, useCallback, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import Spinner from "@/components/Spinner";
import Button from "@/components/Button";
import { Webhook, Plus, RefreshCw, Trash2 } from "lucide-react";

type WebhookRow = {
  id: string;
  organization_id: string;
  url: string;
  token: string | null;
  table_name: "messages" | "conversations";
  operations: Array<"insert" | "update">;
};

export const Route = createFileRoute("/_auth/whatsapp/webhooks")({
  component: WebhooksPanel,
});

function WebhooksPanel() {
  const activeOrgId = useBoundStore((s) => s.ui.activeOrgId);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke(
      `manage-webhooks?organization_id=${activeOrgId}`,
      { method: "GET" },
    );
    if (!error && data) setWebhooks(data as WebhookRow[]);
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleInsert = async () => {
    if (!url.trim() || !activeOrgId) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke("manage-webhooks", {
      method: "POST",
      body: {
        organization_id: activeOrgId,
        url: url.trim(),
        token: token.trim() || null,
      },
    });
    if (!error) {
      setUrl("");
      setToken("");
      await fetchWebhooks();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.functions.invoke(
      `manage-webhooks?id=${id}`,
      { method: "DELETE" },
    );
    if (!error) await fetchWebhooks();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="header items-center gap-2 shrink-0 px-4">
        <Webhook className="w-5 h-5 text-primary" />
        <h1 className="text-[17px] font-medium">Webhooks</h1>
        <div className="flex-1" />
        <button
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
          title="Refresh"
          onClick={fetchWebhooks}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 max-w-3xl space-y-6">
        {/* Add form */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-[15px] font-medium">Add Webhook</h2>
          <div className="flex gap-2">
            <input
              type="text"
              className="text flex-1"
              placeholder="https://your-server.example.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              type="text"
              className="text w-44"
              placeholder="Token (optional)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              loading={saving}
              disabled={!url.trim()}
              onClick={handleInsert}
              className="primary px-4"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          <h2 className="text-[15px] font-medium">Registered Webhooks</h2>
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <Spinner />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-[14px] text-muted-foreground py-4 border border-dashed border-border rounded-xl text-center">
              No webhooks configured.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-2 font-medium">URL</th>
                    <th className="px-4 py-2 font-medium w-16" />
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((wh) => (
                    <tr
                      key={wh.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5 font-mono text-[13px] text-foreground truncate max-w-0 w-full">
                        {wh.url}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                          onClick={() => handleDelete(wh.id)}
                          title="Delete webhook"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
