import type { FileUIPart, UIMessage } from "ai";

const TEXT_TYPES = ["text/", "application/json"];
const TEXT_EXT = /\.(md|txt|csv|json)$/i;

function isTextFile(file: FileUIPart) {
  return (
    TEXT_TYPES.some((t) => file.mediaType?.startsWith(t)) || TEXT_EXT.test(file.filename ?? "")
  );
}

async function readDataUrlText(url: string) {
  const res = await fetch(url);
  return res.text();
}

/**
 * Images and PDFs go to the model as file parts. Text files are read here and
 * sent as text, since the model endpoint only accepts images and PDFs inline.
 */
export async function buildUserParts(
  text: string,
  files: FileUIPart[],
): Promise<UIMessage["parts"]> {
  const parts: UIMessage["parts"] = [];
  for (const file of files) {
    if (isTextFile(file)) {
      const content = await readDataUrlText(file.url);
      parts.push({
        type: "text",
        text: `<attached_file name="${file.filename ?? "file"}">\n${content.slice(0, 200_000)}\n</attached_file>`,
      });
    } else {
      parts.push(file);
    }
  }
  if (text) parts.push({ type: "text", text });
  return parts;
}

export const ATTACHED_FILE_RE = /^<attached_file name="([^"]*)">/;
