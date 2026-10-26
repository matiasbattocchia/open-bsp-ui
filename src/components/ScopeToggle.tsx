import { useTranslation } from "@/hooks/useTranslation";
import type { ConnectionScope } from "@/hooks/useConnectionScope";
import PillToggle, { type PillOption } from "./PillToggle";

/**
 * Whose account is being connected. The organization's option stays visible
 * without the role for it — hiding it would leave a member wondering where the
 * shared inbox went — and says why it is out of reach.
 */
export default function ScopeToggle({
  value,
  onChange,
  isAdmin,
  disabled,
}: {
  value: ConnectionScope;
  onChange: (scope: ConnectionScope) => void;
  isAdmin: boolean;
  disabled?: boolean;
}) {
  const { translate: t } = useTranslation();

  const options: PillOption<ConnectionScope>[] = [
    {
      value: "organization",
      label: t("De la organización"),
      disabled: !isAdmin,
      title: isAdmin ? undefined : t("Requiere permisos de administrador"),
    },
    { value: "personal", label: t("Personal") },
  ];

  return (
    <div className="flex flex-col gap-[6px]">
      <PillToggle
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={options}
      />
      <p className="text-[13px] text-muted-foreground">
        {value === "organization"
          ? t("Sus conversaciones las ve todo el equipo.")
          : t("Sus conversaciones las ves solo vos.")}
      </p>
    </div>
  );
}
