import type { FileUIPart } from "ai";
import { FileText, Paperclip, X } from "lucide-react";
import { forwardRef } from "react";
import { toast } from "sonner";

import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

export const ACCEPTED_FILES =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,application/json,.md,.txt,.csv,.json";

type NovaComposerProps = {
  onSend: (text: string, files: FileUIPart[]) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  onStop?: () => void;
};

function AttachmentChips() {
  const { files, remove } = usePromptInputAttachments();
  if (files.length === 0) return null;
  return (
    <PromptInputHeader className="flex flex-wrap gap-2 border-0 px-3 pt-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="group relative flex h-12 items-center gap-2 rounded-md border border-line bg-panel2 pr-7 text-[11px] text-mute"
        >
          {file.mediaType?.startsWith("image/") && file.url ? (
            <img
              src={file.url}
              alt={file.filename ?? ""}
              className="size-12 rounded-l-md object-cover"
            />
          ) : (
            <span className="grid size-12 place-items-center">
              <FileText className="size-4" />
            </span>
          )}
          <span className="max-w-[140px] truncate">{file.filename}</span>
          <button
            type="button"
            aria-label={`Remove ${file.filename ?? "file"}`}
            onClick={() => remove(file.id)}
            className="absolute right-1 top-1 grid size-5 place-items-center rounded text-dim hover:text-ink"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </PromptInputHeader>
  );
}

function AttachButton() {
  const { openFileDialog } = usePromptInputAttachments();
  return (
    <PromptInputButton
      title="Attach images, PDFs or text files"
      aria-label="Attach files"
      onClick={openFileDialog}
    >
      <Paperclip className="size-4" />
    </PromptInputButton>
  );
}

export const NovaComposer = forwardRef<HTMLTextAreaElement, NovaComposerProps>(
  function NovaComposer({ onSend, status, onStop }, ref) {
    const busy = status === "submitted" || status === "streaming";

    function handleSubmit(message: PromptInputMessage) {
      const text = message.text?.trim() ?? "";
      if ((!text && message.files.length === 0) || busy) return;
      onSend(text, message.files);
    }

    return (
      <div className="shrink-0 px-4 pb-6 pt-2 sm:px-6">
        <PromptInput
          onSubmit={handleSubmit}
          accept={ACCEPTED_FILES}
          multiple
          globalDrop
          maxFiles={10}
          maxFileSize={10 * 1024 * 1024}
          onError={(err) =>
            toast.error(
              err.code === "max_file_size"
                ? "Files must be under 10 MB."
                : err.code === "accept"
                  ? "Nova can read images, PDFs and text files for now."
                  : err.message,
            )
          }
          className="mx-auto max-w-[640px] rounded-xl border border-line bg-panel shadow-none transition-colors duration-150 focus-within:border-mute"
        >
          <AttachmentChips />
          <PromptInputTextarea
            ref={ref}
            autoFocus
            placeholder="Ask Nova anything…"
            className="min-h-[52px] bg-transparent px-4 pt-3 text-[14px] leading-relaxed text-ink placeholder:text-dim"
          />
          <PromptInputFooter className="border-0 px-2.5 pb-2.5">
            <PromptInputTools>
              <AttachButton />
            </PromptInputTools>
            <div className="ml-auto flex items-center gap-2">
              {busy ? (
                <PromptInputSubmit
                  size="icon-sm"
                  status="streaming"
                  onClick={(event) => {
                    event.preventDefault();
                    onStop?.();
                  }}
                  className="rounded-md bg-glow text-glow-foreground hover:bg-glow/90"
                />
              ) : (
                <PromptInputSubmit
                  size="icon-sm"
                  className="rounded-md bg-glow text-glow-foreground hover:bg-glow/90"
                />
              )}
            </div>
          </PromptInputFooter>
        </PromptInput>
        <p className="mx-auto mt-2.5 max-w-[640px] text-center font-mono text-[9px] tracking-wide text-dim/60">
          Nova can make mistakes · verify important output
        </p>
      </div>
    );
  },
);
