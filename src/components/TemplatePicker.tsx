import { useState, useRef, useEffect } from "react";
import { Plus, Search, X } from "lucide-react";
import useBoundStore from "@/stores/useBoundStore";
import { useTemplates } from "@/queries/useTemplates";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import type { TemplateData } from "@/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export default function TemplatePicker() {
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const toggle = useBoundStore((store) => store.ui.toggle);
  const setTemplateDraft = useBoundStore((store) => store.ui.setTemplateDraft);

  const orgAddress = conv?.organization_address;
  const { data: templates, isLoading } = useTemplates(orgAddress);
  const approved = templates?.filter((t) => t.status === "APPROVED");

  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  const filtered = search
    ? approved?.filter((tpl) =>
        tpl.name.toLowerCase().includes(search.toLowerCase()),
      )
    : approved;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") toggle("templatePicker", false);
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        toggle("templatePicker", false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [toggle]);

  function select(template: TemplateData) {
    if (!activeConvId) return;

    const bodyExamples = template.components.find((c) => c.type === "BODY")?.example?.body_text[0] || [];
    const headExamples = template.components.find((c) => c.type === "HEADER")?.example?.header_text || [];

    setTemplateDraft(activeConvId, {
      template,
      bodyVarValues: bodyExamples.map(() => ""),
      headVarValues: headExamples.map(() => ""),
    });
    toggle("templatePicker", false);
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-0 w-full max-h-[320px] overflow-hidden flex flex-col z-20 bg-background rounded-[24px] shadow-lg"
    >
      {/* Search — ChatSearch style */}
      <div className="px-[40px] pt-[12px] pb-[8px]">
        <div className="flex items-center bg-incoming-chat-bubble h-[32px] rounded-full px-[12px]">
          <Search className="text-muted-foreground w-[16px] h-[16px] stroke-[3px] shrink-0" />
          <input
            type="text"
            className="bg-transparent border-none outline-none w-full text-[14px] mx-[12px] placeholder:text-muted-foreground"
            placeholder={t("Buscar plantilla...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <X
              className="cursor-pointer text-muted-foreground w-[16px] h-[16px] stroke-[3px]"
              onClick={() => setSearch("")}
            />
          )}
        </div>
      </div>

      {/* List — ChatList style */}
      <div className="overflow-y-auto px-[40px] pb-[8px] mb-[16px]">
        <div className="flex flex-col gap-[4px]">
          {isLoading ? (
            <div className="px-[10px] py-[16px] text-muted-foreground text-[14px]">
              <T>Cargando...</T>
            </div>
          ) : !filtered?.length ? (
            <div className="px-[10px] py-[8px] text-muted-foreground text-[13px]">
              <T>Solo se muestran plantillas aprobadas</T>
            </div>
          ) : (
            filtered.map((tpl) => {
              const body = tpl.components.find((c) => c.type === "BODY")?.text || "";
              return (
                <button
                  key={tpl.id}
                  className="w-full text-left px-[10px] py-[8px] rounded-xl hover:bg-accent cursor-pointer"
                  onClick={() => select(tpl)}
                >
                  <div className="font-medium text-[14px] truncate">{tpl.name}</div>
                  <div className="text-[13px] text-muted-foreground truncate">
                    {body}
                  </div>
                </button>
              );
            })
          )}
          {orgAddress && (
            <div
              className="w-full text-left px-[10px] py-[8px] rounded-xl hover:bg-accent cursor-pointer"
              onClick={() => {
                toggle("templatePicker", false);
                navigate({
                  to: "/integrations/whatsapp/$orgAddressId/templates/new",
                  params: { orgAddressId: orgAddress },
                  hash: (prevHash) => prevHash!,
                });
              }}
            >
              <div className="font-medium text-[14px] flex items-center gap-[4px]">
                <Plus className="w-[14px] h-[14px]" />
                <T>Crear plantilla</T>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
