import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useLabels, useCreateLabel, useDeleteLabel, useUpdateLabel } from "@/queries/useLabels";
import { useCurrentAgent } from "@/queries/useAgents";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";

export const Route = createFileRoute("/_auth/settings/labels/")({
  component: ListLabels,
});

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

function LabelRow({
  label,
  isAdmin,
}: {
  label: { name: string; color: string | null };
  isAdmin: boolean;
}) {
  const { translate: t } = useTranslation();
  const deleteLabel = useDeleteLabel();
  const updateLabel = useUpdateLabel();
  const [editingColor, setEditingColor] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-accent group">
      {/* Color swatch — click to pick */}
      <button
        type="button"
        className="w-[28px] h-[28px] rounded-full border border-border shrink-0 disabled:cursor-default"
        style={{ backgroundColor: label.color || "#6b7280" }}
        title={isAdmin ? t("Cambiar color") : undefined}
        disabled={!isAdmin}
        onClick={() => setEditingColor((v) => !v)}
      />

      <span className="text-foreground text-[16px] grow truncate">
        {label.name}
      </span>

      {isAdmin && (
        <button
          type="button"
          className="p-[6px] rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-30"
          title={t("Eliminar")}
          disabled={deleteLabel.isPending}
          onClick={() => deleteLabel.mutate(label.name)}
        >
          {deleteLabel.isPending ? (
            <Spinner size={16} />
          ) : (
            <Trash2 className="w-[16px] h-[16px] text-muted-foreground" />
          )}
        </button>
      )}

      {/* Color picker popover */}
      {editingColor && (
        <div className="absolute right-[60px] mt-[64px] z-10 bg-popover border border-border rounded-xl p-3 shadow-lg flex flex-wrap gap-2 w-[160px]">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="w-[24px] h-[24px] rounded-full border-2 hover:scale-110 transition-transform"
              style={{
                backgroundColor: c,
                borderColor: label.color === c ? "var(--color-foreground)" : "transparent",
              }}
              onClick={() => {
                updateLabel.mutate({ name: label.name, color: c });
                setEditingColor(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListLabels() {
  const { translate: t } = useTranslation();
  const { data: labels } = useLabels();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const createLabel = useCreateLabel();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]);
  const [showForm, setShowForm] = useState(false);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createLabel.mutate(
      { name: trimmed, color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor(PRESET_COLORS[4]);
          setShowForm(false);
        },
      },
    );
  }

  return (
    <>
      <SectionHeader title={t("Etiquetas")} />

      <SectionBody>
        {/* Create button */}
        <div
          className={
            "h-[72px] flex rounded-xl group " +
            (isAdmin ? "cursor-pointer hover:bg-accent" : "opacity-50 grayscale")
          }
          title={
            !isAdmin
              ? `${t("Crear etiqueta")} - ${t("Requiere permisos de administrador")}`
              : t("Crear etiqueta")
          }
          onClick={isAdmin ? () => setShowForm((v) => !v) : undefined}
        >
          <div className="pl-[10px] pr-[15px] flex items-center">
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          </div>
          <div className="flex flex-col justify-center grow min-w-0 pr-[15px]">
            <div className="truncate text-foreground text-[16px]">
              {t("Crear etiqueta")}
            </div>
          </div>
        </div>

        {/* Inline create form */}
        {showForm && isAdmin && (
          <div className="flex flex-col gap-3 px-2 pb-3">
            <label>
              <div className="label">{t("Nombre")}</div>
              <input
                className="text"
                placeholder={t("Nombre de la etiqueta")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowForm(false);
                }}
                autoFocus
              />
            </label>

            <div>
              <div className="label">{t("Color")}</div>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-[24px] h-[24px] rounded-full border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c,
                      borderColor:
                        newColor === c
                          ? "var(--color-foreground)"
                          : "transparent",
                    }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Label list */}
        <div className="relative flex flex-col">
          {labels?.map((label) => (
            <LabelRow key={label.name} label={label} isAdmin={isAdmin} />
          ))}
          {labels?.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Tag className="w-[32px] h-[32px]" />
              <p>{t("No hay etiquetas. Crea la primera.")}</p>
            </div>
          )}
        </div>
      </SectionBody>

      {showForm && isAdmin && (
        <SectionFooter>
          <Button
            type="button"
            onClick={handleCreate}
            invalid={!newName.trim()}
            loading={createLabel.isPending}
            className="primary"
          >
            {t("Crear")}
          </Button>
        </SectionFooter>
      )}
    </>
  );
}
