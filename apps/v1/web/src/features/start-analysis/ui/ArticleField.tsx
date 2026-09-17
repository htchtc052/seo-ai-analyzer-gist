import { useId, type ReactNode } from "react";
import { FetchedArticle } from "@/entities/article";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { ArticleSlot } from "../model/useNewAnalysis";

type Props = {
  label: string;
  slot: ArticleSlot;
  disabled: boolean;
  onUrlChange: (url: string) => void;
  children?: ReactNode;
};

export function ArticleField({
  label,
  slot,
  disabled,
  onUrlChange,
  children,
}: Props) {
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="url"
        placeholder="https://"
        value={slot.url}
        disabled={disabled}
        onChange={(event) => onUrlChange(event.target.value)}
      />
      {children}
      {slot.error && (
        <Alert variant="destructive">
          <AlertDescription>{slot.error}</AlertDescription>
        </Alert>
      )}
      {slot.article && <FetchedArticle article={slot.article} />}
    </div>
  );
}
