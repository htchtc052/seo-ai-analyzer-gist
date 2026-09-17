import type { Topic } from "../model/useNewAnalysis";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

type Props = {
  topics: Topic[];
  topic: Topic;
  disabled: boolean;
  onSelect: (topic: Topic) => void;
};

export function ExampleTopic({ topics, topic, disabled, onSelect }: Props) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      Example:
      <Button
        type="button"
        variant="link"
        size="xs"
        disabled={disabled}
        onClick={() => onSelect(topic)}
      >
        {topic.title}
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="link" size="xs" disabled={disabled}>
            Change
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Example topic</DialogTitle>
            <DialogDescription>
              Links for your article and both competitors are filled in from the
              chosen topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {topics.map((item) => (
              <DialogClose key={item.title} asChild>
                <Button
                  type="button"
                  variant={item === topic ? "secondary" : "outline"}
                  className="h-auto flex-col items-start py-3"
                  onClick={() => onSelect(item)}
                >
                  <span>{item.title}</span>
                  <span className="font-normal text-muted-foreground">
                    {[item.article, ...item.competitors]
                      .map((example) => example.site)
                      .join(" · ")}
                  </span>
                </Button>
              </DialogClose>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </p>
  );
}
