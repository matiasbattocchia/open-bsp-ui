import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateContact } from "@/queries/useContacts";
import { useForm, useFieldArray } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { Plus, X } from "lucide-react";
import type { ContactWithAddressesInsert } from "@/supabase/client";
import { isValidPhoneNumber } from "@/utils/FormatUtils";

export const Route = createFileRoute("/_auth/contacts/new")({
  component: ContactNew,
});

function ContactNew() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createContact = useCreateContact();

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty, errors },
  } = useForm<ContactWithAddressesInsert>({
    mode: 'onTouched',
    defaultValues: {
      addresses: [{ address: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  });

  return (
    <>
      <SectionHeader title={t("Nuevo contacto")} />

      <SectionBody>
        <form
          id="contact-form"
          onSubmit={handleSubmit(data => createContact.mutate(data, {
            onSuccess: (contact) => navigate({
              to: `/contacts/${contact.id}`,
              hash: (prevHash) => prevHash!,
            }),
          }))}
        >
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              type="text"
              className="text"
              placeholder={t("Nombre del contacto")}
              {...register("name")}
            />
          </label>

          {fields.map((field, idx) => (
            <label key={field.id}>
              <div className="label">{t("Teléfono")} {idx + 1}</div>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  className={`text ${errors.addresses?.[idx]?.address ? "border-destructive" : ""}`}
                  placeholder={t("+54 9 11 1234 5678")}
                  {...register(`addresses.${idx}.address`, {
                    validate: (value) => !value || isValidPhoneNumber(value) || t("Número inválido")
                  })}
                />
                <button
                  type="button"
                  className="p-[8px] rounded-full hover:bg-muted transition-colors"
                  onClick={() => remove(idx)}
                  title={t("Eliminar")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {errors.addresses?.[idx]?.address && (
                <div className="text-destructive text-[12px]">{errors.addresses[idx]!.address!.message}</div>
              )}
            </label>
          ))}

          {/* Add phone number button */}
          <button
            type="button"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-full font-medium transition-colors w-fit text-[14px] flex items-center gap-2"
            onClick={() => append({ address: "" })}
          >
            <Plus className="w-4 h-4" />
            {t("Agregar teléfono")}
          </button>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="contact-form"
          type="submit"
          invalid={!isValid || !isDirty}
          loading={createContact.isPending}
          className="primary"
        >
          {t("Crear")}
        </Button>
      </SectionFooter>
    </>
  );
}
