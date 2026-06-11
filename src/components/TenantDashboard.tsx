import { useState, useEffect, useCallback, useRef } from "react";
import {
  supabase,
  type ConversationRow,
  type MessageRow,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import Spinner from "@/components/Spinner";
import Button from "@/components/Button";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import {
  Wrench,
  Webhook,
  Inbox,
  Send,
  RefreshCw,
  Check,
  X,
  Trash2,
  ArrowRight,
} from "lucide-react";

type Tab = "management" | "webhooks" | "inbox";

type OrgAddressExtra = {
  waba_id?: string;
  business_id?: string;
  phone_number?: string;
  verified_name?: string;
  access_token?: string;
  phone_number_id?: string;
  [key: string]: unknown;
};

type OrgAddressRow = {
  organization_id: string;
  address: string;
  status: string;
  extra: OrgAddressExtra | null;
};

type WebhookRow = {
  id: string;
  organization_id: string;
  url: string;
  token: string | null;
  table_name: "messages" | "conversations";
  operations: Array<"insert" | "update">;
};

export default function TenantDashboard() {
  const activeOrgId = useBoundStore((s) => s.ui.activeOrgId);
  const [tab, setTab] = useState<Tab>("management");

  if (!activeOrgId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-[15px]">
        Select an organization to view the dashboard.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="header items-center gap-1 shrink-0">
        <button
          className={`px-4 py-1.5 rounded-full text-[14px] flex items-center gap-1.5 transition-colors ${tab === "management" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          onClick={() => setTab("management")}
        >
          <Wrench className="w-4 h-4" />
          Management Grid
        </button>
        <button
          className={`px-4 py-1.5 rounded-full text-[14px] flex items-center gap-1.5 transition-colors ${tab === "webhooks" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          onClick={() => setTab("webhooks")}
        >
          <Webhook className="w-4 h-4" />
          Webhooks
        </button>
        <button
          className={`px-4 py-1.5 rounded-full text-[14px] flex items-center gap-1.5 transition-colors ${tab === "inbox" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          onClick={() => setTab("inbox")}
        >
          <Inbox className="w-4 h-4" />
          Shared Inbox
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "management" && <ManagementGrid orgId={activeOrgId} />}
        {tab === "webhooks" && <WebhookSettings orgId={activeOrgId} />}
        {tab === "inbox" && <SharedInbox orgId={activeOrgId} />}
      </div>
    </div>
  );
}

function ManagementGrid({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<OrgAddressRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalRow, setModalRow] = useState<OrgAddressRow | null>(null);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultState, setResultState] = useState<"idle" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizations_addresses")
      .select("organization_id, address, status, extra")
      .eq("organization_id", orgId);

    if (!error && data) {
      setRows(data as OrgAddressRow[]);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openModal = (row: OrgAddressRow) => {
    setModalRow(row);
    setRecipient("");
    setMessage("");
    setResultState("idle");
    setErrorText("");
  };

  const closeModal = () => {
    setModalRow(null);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!modalRow || !recipient.trim() || !message.trim()) return;

    setSubmitting(true);
    setResultState("idle");
    setErrorText("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userJwt = session?.access_token;
      const anonKey = (supabase as any).supabaseKey;

      if (!userJwt) {
        throw new Error("No active session found.");
      }

      const response = await fetch(
        "https://wlnquwjdbrlnxfwonvnd.supabase.co/functions/v1/test-outbound",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userJwt}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number_id: modalRow.address,
            to: recipient.trim(),
            message: message.trim(),
          }),
        },
      );

      if (response.ok) {
        setResultState("success");
        setTimeout(() => {
          setModalRow(null);
          setResultState("idle");
          setMessage("");
          setRecipient("");
        }, 1500);
      } else {
        const body = await response.text();
        setResultState("error");
        setErrorText(body || `HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      setResultState("error");
      setErrorText(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-[16px] text-foreground">Organization Addresses</h2>
        <div className="flex items-center gap-2">
          <WhatsAppIntegration onSuccess={() => { fetchRows(); }} />
          <button
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            title="Refresh"
            onClick={fetchRows}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-[14px]">
            No organization addresses found.
          </div>
        ) : (
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="px-4 py-2 font-medium">Organization ID</th>
                <th className="px-4 py-2 font-medium">Address</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">WABA ID</th>
                <th className="px-4 py-2 font-medium">Phone Number ID</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.organization_id}-${row.address}-${i}`}
                  className="border-b border-border hover:bg-muted/50"
                >
                  <td className="px-4 py-2 font-mono text-[13px] text-foreground">
                    {row.organization_id}
                  </td>
                  <td className="px-4 py-2 text-foreground">{row.address}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[12px] ${row.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-[13px] text-muted-foreground">
                    {row.extra?.waba_id || "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[13px] text-muted-foreground">
                    {row.extra?.phone_number_id || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="px-3 py-1 rounded-full text-[13px] bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      onClick={() => openModal(row)}
                    >
                      Test Outbound
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal overlay */}
      {modalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-[16px] text-foreground font-medium">
              Test Outbound
            </h3>

            <div className="space-y-1">
              <label className="text-[13px] text-muted-foreground">
                Recipient Number (To)
              </label>
              <input
                type="text"
                className="text w-full"
                placeholder="+1234567890"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] text-muted-foreground">
                Message Content
              </label>
              <textarea
                className="text w-full min-h-[80px] resize-y"
                placeholder="Enter your test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1.5 rounded-full text-[13px] hover:bg-muted text-muted-foreground"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                disabled={submitting || resultState === "success" || !recipient.trim() || !message.trim()}
                onClick={handleSubmit}
                className={`px-4 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                  resultState === "success"
                    ? "bg-green-500 text-white"
                    : resultState === "error"
                      ? "bg-red-500 text-white"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {submitting ? (
                  <Spinner />
                ) : resultState === "success" ? (
                  <>
                    <Check className="w-4 h-4" /> Sent
                  </>
                ) : resultState === "error" ? (
                  <>
                    <X className="w-4 h-4" /> Failed
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Send
                  </>
                )}
              </button>
            </div>

            {resultState === "success" && (
              <p className="text-[13px] text-green-600">
                Message sent successfully.
              </p>
            )}
            {resultState === "error" && (
              <p className="text-[13px] text-red-500 break-all">
                {errorText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WebhookSettings({ orgId }: { orgId: string }) {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke(
      `manage-webhooks?organization_id=${orgId}`,
      { method: "GET" },
    );
    if (!error && data) setWebhooks(data as WebhookRow[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleInsert = async () => {
    if (!url.trim()) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke("manage-webhooks", {
      method: "POST",
      body: { organization_id: orgId, url: url.trim(), token: token.trim() || null },
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-[16px] text-foreground">Webhook Settings</h2>
        <button
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
          title="Refresh"
          onClick={fetchWebhooks}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[14px] text-foreground font-medium">
            Add Webhook
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="text flex-1"
              placeholder="https://n8n.example.com/webhook/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              type="text"
              className="text w-40"
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
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] text-foreground font-medium">
            Existing Webhooks
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <Spinner />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-muted-foreground text-[14px]">
              No webhooks configured.
            </div>
          ) : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="px-4 py-2 font-medium">URL</th>
                  <th className="px-4 py-2 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((wh) => (
                  <tr
                    key={wh.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="px-4 py-2 font-mono text-[13px] text-foreground truncate max-w-0 w-full">
                      {wh.url}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive flex items-center gap-1 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}

function SharedInbox({ orgId }: { orgId: string }) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find(
    (c) => c.id === selectedConvId,
  );

  const fetchConversations = useCallback(async () => {
    setConvLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setConversations(data as ConversationRow[]);
    }
    setConvLoading(false);
  }, [orgId]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as MessageRow[]);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId, fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`tenant-inbox-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const msg = payload.new as MessageRow;
          if (selectedConvId && msg.conversation_id === selectedConvId) {
            setMessages((prev) => [...prev, msg]);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [orgId, selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConv) return;
    setSending(true);

    const { error } = await supabase.from("messages").insert({
      organization_id: orgId,
      conversation_id: selectedConv.id,
      organization_address: selectedConv.organization_address,
      service: selectedConv.service,
      direction: "outgoing",
      content: {
        type: "text",
        kind: "text",
        text: messageText.trim(),
      },
      status: {},
    } as never);

    if (!error) {
      setMessageText("");
    }
    setSending(false);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-[16px] text-foreground">Conversations</h2>
          <button
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            title="Refresh"
            onClick={fetchConversations}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {convLoading ? (
            <div className="flex items-center justify-center h-20">
              <Spinner />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-muted-foreground text-[14px]">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${
                  selectedConvId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedConvId(conv.id)}
              >
                <div className="text-[14px] text-foreground truncate">
                  {conv.name || conv.contact_address || conv.id}
                </div>
                <div className="text-[12px] text-muted-foreground truncate">
                  {conv.service} · {conv.status}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedConv ? (
          <>
            <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
              <h3 className="text-[16px] text-foreground truncate">
                {selectedConv.name ||
                  selectedConv.contact_address ||
                  selectedConv.id}
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-[14px] mt-8">
                  No messages yet.
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-xl px-3 py-2 text-[14px] ${
                      msg.direction === "outgoing"
                        ? "bg-[var(--chat-out)] text-foreground"
                        : "bg-[var(--chat-in)] text-foreground border border-border"
                    }`}
                  >
                    {msg.content && typeof msg.content === "object" && "text" in msg.content
                      ? (msg.content as { text: string }).text
                      : JSON.stringify(msg.content)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border shrink-0 flex gap-2">
              <textarea
                className="text flex-1 border border-border rounded-xl px-3 py-2 text-[14px] min-h-[40px] max-h-[120px] resize-none focus-visible:border-primary"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
              />
              <Button
                loading={sending}
                disabled={!messageText.trim()}
                onClick={handleSend}
                className="primary px-4 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[15px]">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
}
