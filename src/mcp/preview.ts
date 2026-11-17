import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import type { Formats } from '../domain/chat/format.ts';
import { Message } from '../domain/chat/message.ts';
import * as Schemas from './schemas.ts';
import { GUIDE_URI } from './guide.ts';
import type { Guard } from './guard.ts';

const Input = z.object({ text: Schemas.Text, format: Schemas.Format });

const Output = z.object({ text: z.string().describe('The text exactly as send would post it.') });

/**
 * Adds the `preview` tool, which shows a message exactly as `send` would post it, without sending.
 *
 * @param server - Server to add the tool to.
 * @param formats - Format for each name.
 * @param guard - Keeps library errors away from the model.
 */
export function registerPreview(server: McpServer, formats: Formats, guard: Guard): void {
  server.registerTool(
    'preview',
    {
      title: 'Preview a message',
      description: `Show exactly how a message will look in Google Chat before sending it with send. Read ${GUIDE_URI} for tone and formatting.`,
      inputSchema: Input,
      outputSchema: Output,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    guard('preview', async ({ text, format }) => {
      const { text: rendered } = Message.from(formats[format], text);
      return { content: [{ type: 'text', text: rendered }], structuredContent: { text: rendered } };
    }),
  );
}
