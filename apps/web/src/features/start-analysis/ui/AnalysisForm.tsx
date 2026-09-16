import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Minus, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { analysisInputSchema, type AnalysisInput } from "@/entities/analysis";

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
    getValues,
    setValue,
    formState: { errors },
  } = useForm<AnalysisInput>({
    resolver: zodResolver(analysisInputSchema),
    mode: "onTouched",
    defaultValues: {
      searchQuery: "",
      primarySiteUrl: "",
      competitorSiteUrl: "",
      maxPagesPerSite: 15,
    },
  });

  function adjustPageLimit(delta: number) {
    const current = getValues("maxPagesPerSite");
    const value = Math.min(30, Math.max(1, current + delta));
    setValue("maxPagesPerSite", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <FieldLabel htmlFor="primarySiteUrl">Ваш сайт</FieldLabel>
          <Input
            id="primarySiteUrl"
            type="url"
            placeholder="https://example.ru"
            aria-invalid={Boolean(errors.primarySiteUrl)}
            disabled={isStarting}
            {...register("primarySiteUrl")}
          />
          <FieldError errors={[errors.primarySiteUrl]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="competitorSiteUrl">Сайт конкурента</FieldLabel>
          <Input
            id="competitorSiteUrl"
            type="url"
            placeholder="https://competitor.ru"
            aria-invalid={Boolean(errors.competitorSiteUrl)}
            disabled={isStarting}
            {...register("competitorSiteUrl")}
          />
          <FieldError errors={[errors.competitorSiteUrl]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="maxPagesPerSite">
            Максимум страниц на сайт
          </FieldLabel>
          <div className="flex max-w-52 items-center">
            <Button
              type="button"
              variant="outline"
              aria-label="Уменьшить лимит страниц"
              disabled={isStarting}
              onClick={() => adjustPageLimit(-1)}
              className="rounded-r-none px-3"
            >
              <Minus />
            </Button>
            <Input
              id="maxPagesPerSite"
              type="number"
              min={1}
              max={30}
              step={1}
              inputMode="numeric"
              aria-invalid={Boolean(errors.maxPagesPerSite)}
              disabled={isStarting}
              className="rounded-none border-x-0 text-center shadow-none"
              {...register("maxPagesPerSite", { valueAsNumber: true })}
            />
            <Button
              type="button"
              variant="outline"
              aria-label="Увеличить лимит страниц"
              disabled={isStarting}
              onClick={() => adjustPageLimit(1)}
              className="rounded-l-none px-3"
            >
              <Plus />
            </Button>
          </div>
          <FieldDescription>
            Обход всегда идёт от корня домена, поэтому ссылку на конкретную
            статью можно не искать. Сохраняются только содержательные страницы,
            допустимо от 1 до 30.
          </FieldDescription>
          <FieldError errors={[errors.maxPagesPerSite]} />
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
          {isStarting ? "Запускаем…" : "Сравнить сайты"}
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
