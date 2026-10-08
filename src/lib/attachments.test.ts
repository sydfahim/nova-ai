import assert from "node:assert/strict";
import test from "node:test";
import type { FileUIPart } from "ai";

import { buildUserParts } from "./attachments.ts";

test("inlines text attachments before the user's prompt", async () => {
  const parts = await buildUserParts("Summarize this", [
    {
      type: "file",
      mediaType: "text/plain",
      filename: "notes.txt",
      url: "data:text/plain;base64,SGVsbG8=",
    },
  ]);
  assert.deepEqual(parts, [
    { type: "text", text: '<attached_file name="notes.txt">\nHello\n</attached_file>' },
    { type: "text", text: "Summarize this" },
  ]);
});

test("preserves images and PDFs in an attachment-only message", async () => {
  const files: FileUIPart[] = [
    {
      type: "file",
      mediaType: "image/png",
      filename: "image.png",
      url: "data:image/png;base64,AA==",
    },
    {
      type: "file",
      mediaType: "application/pdf",
      filename: "doc.pdf",
      url: "data:application/pdf;base64,AA==",
    },
  ];
  assert.deepEqual(await buildUserParts("", files), files);
});

test("recognizes Markdown by extension and caps inlined file content", async () => {
  const content = "a".repeat(200_001);
  const parts = await buildUserParts("", [
    {
      type: "file",
      mediaType: "application/octet-stream",
      filename: "notes.md",
      url: `data:text/plain,${content}`,
    },
  ]);
  assert.deepEqual(parts, [
    {
      type: "text",
      text: `<attached_file name="notes.md">\n${"a".repeat(200_000)}\n</attached_file>`,
    },
  ]);
});
