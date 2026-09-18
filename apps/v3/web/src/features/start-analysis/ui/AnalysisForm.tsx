import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Plus, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  analysisInputSchema,
  type AnalysisForm as AnalysisFormValues,
  type AnalysisInput,
} from "@/entities/analysis";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

const MAX_COMPETITORS = 5;

type AnalysisFormProps = {
  onSubmit: (input: AnalysisInput) => void;
  isStarting: boolean;
  error: string | null;
};

export function AnalysisForm({
  onSubmit,
  isStarting,
  error,
}: AnalysisFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisInputSchema),
    mode: "onTouched",
    defaultValues: {
      searchQuery: "",
      primaryUrl: "",
      competitorUrls: [{ url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "competitorUrls",
  });

  function submit(values: AnalysisFormValues) {
    onSubmit({
      searchQuery: values.searchQuery,
      primaryUrl: values.primaryUrl,
      competitorUrls: values.competitorUrls.map((item) => item.url),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="searchQuery">Поисковый запрос</FieldLabel>
          <Input
            id="searchQuery"
            placeholder="Например, как выбрать посудомоечную машину"
            aria-invalid={Boolean(errors.searchQuery)}
            disabled={isStarting}
            {...register("searchQuery")}
          />
          <FieldError errors={[errors.searchQuery]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="primaryUrl">Наша страница</FieldLabel>
          <Input
            id="primaryUrl"
            type="url"
            placeholder="https://example.ru/article"
            aria-invalid={Boolean(errors.primaryUrl)}
            disabled={isStarting}
            {...register("primaryUrl")}
          />
          <FieldDescription>
            Адрес конкретной статьи, а не сайта: обхода здесь нет.
          </FieldDescription>
          <FieldError errors={[errors.primaryUrl]} />
        </Field>

        <Field>
          <FieldLabel>Страницы конкурентов</FieldLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://competitor.ru/article"
                aria-label={`Конкурент ${index + 1}`}
                aria-invalid={Boolean(errors.competitorUrls?.[index]?.url)}
                disabled={isStarting}
                {...register(`competitorUrls.${index}.url`)}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Убрать конкурента ${index + 1}`}
                  disabled={isStarting}
                  onClick={() => remove(index)}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={isStarting || fields.length >= MAX_COMPETITORS}
            onClick={() => append({ url: "" })}
            className="self-start"
          >
            <Plus />
            Добавить конкурента
          </Button>
          <FieldDescription>
            От одного до пяти адресов. Сравниваем только их, ничего не
            досматривая на остальном сайте.
          </FieldDescription>
          <FieldError
            errors={[
              errors.competitorUrls?.root ?? errors.competitorUrls,
              ...fields.map((_, index) => errors.competitorUrls?.[index]?.url),
            ]}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={isStarting}
          className="w-full"
        >
          {isStarting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <ArrowRight />
          )}
          {isStarting ? "Запускаем…" : "Сравнить страницы"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>
    </form>
  );
}
