import { useForm } from "react-hook-form";
import { useTranslation } from "@/hooks/useTranslation";
import SectionBody from "@/components/SectionBody";

interface MemberFormData {
  name: string;
  email: string;
  role: "user" | "admin";
}

interface MemberFormProps {
  defaultValues?: Partial<MemberFormData>;
  onSubmit: (data: MemberFormData) => void;
  isPending: boolean;
  submitText: string;
}

export function MemberForm({
  defaultValues,
  onSubmit,
  isPending,
  submitText,
}: MemberFormProps) {
  const { translate: t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<MemberFormData>({
    defaultValues: {
      role: "user",
      ...defaultValues,
    },
  });

  return (
    <SectionBody className="gap-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label>
          <div className="label">{t("Nombre")}</div>
          <input
            className="text"
            {...register("name", { required: true })}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("Correo electrónico")}</span>
          <input
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("email", { required: true })}
          />
        </label>

        <label>
          <div className="label">{t("Rol")}</div>
          <select
            {...register("role", { required: true })}
          >
            <option value="user">{t("Usuario")}</option>
            <option value="admin">{t("Administrador")}</option>
            <option value="owner">{t("Propietario")}</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isPending || !isValid}
          className="bg-primary text-primary-foreground rounded h-[24px] text-[16px] py-[8px]"
        >
          {isPending ? "..." : submitText}
        </button>
      </form>
    </SectionBody>
  );
}
