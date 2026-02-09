import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useContact,
  useDeleteContact,
  useUpdateContact,
} from "@/queries/useContacts";
import { useForm, useFieldArray } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { Plus, X } from "lucide-react";
import { useMemo } from "react";
import type { ContactWithAddressesUpdate } from "@/supabase/client";
import { isValidPhoneNumber, formatPhoneNumber } from "@/utils/FormatUtils";

export const Route = createFileRoute("/_auth/contacts/$contactId")({
  component: ContactDetail,
});

function ContactDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { contactId } = Route.useParams();
  const { data: contact } = useContact(contactId);
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();

  // Track original addresses (these will be readonly)
  const originalAddresses = useMemo(
    () => new Set(contact?.addresses.map(a => a.address) ?? []),
    [contact]
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { isDirty, isValid, errors },
  } = useForm<ContactWithAddressesUpdate>({
    mode: 'onTouched',
    values: contact
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  });

  return contact && (
    <>
      <SectionHeader
        title={contact.name || t("Sin nombre")}
        onDelete={() => {
          deleteContact.mutate(contactId, {
            onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
          });
        }}
        deleteLoading={deleteContact.isPending}
      />

      <SectionBody>
        <form
          id="contact-form"
          onSubmit={handleSubmit(data => updateContact.mutate(data))}
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

          {fields.map((field, idx) => {
            const isExisting = originalAddresses.has(field.address ?? "");
            return (
              <label key={field.id}>
                <div className="label">{t("Teléfono")} {idx + 1} {field.extra?.synced?.action === 'add' ? "(" + t("Sincronizado") + ")" : ""}</div>
                <div className="flex items-center gap-2">
                  {isExisting ? (
                    <input
                      type="tel"
                      className="text"
                      value={formatPhoneNumber(field.address || "")}
                      readOnly
                    />
                  ) : (
                    <input
                      type="tel"
                      className={`text ${errors.addresses?.[idx]?.address ? "border-destructive" : ""}`}
                      placeholder={t("+54 9 11 1234 5678")}
                      {...register(`addresses.${idx}.address`, {
                        validate: (value) => !value || isValidPhoneNumber(value) || t("Número inválido")
                      })}
                    />
                  )}
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
            );
          })}

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
          loading={updateContact.isPending}
          className="primary"
        >
          {t("Actualizar")}
        </Button>
      </SectionFooter>
    </>
  );
}
