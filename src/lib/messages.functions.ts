import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  content: z.string().trim().min(2).max(500),
  displayName: z.string().trim().max(40).optional().or(z.literal("")),
});

export const submitMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MessageSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("anonymous_messages").insert({
      content: data.content,
      display_name: data.displayName || null,
      status: "PENDING",
    });
    if (error) throw new Error("Could not send your message. Please try again.");
    return { ok: true };
  });
