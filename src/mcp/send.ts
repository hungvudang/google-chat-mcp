import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import type { Formats } from '../domain/chat/format.ts';
import { Message } from '../domain/chat/message.ts';
import type { Spaces } from '../domain/chat/spaces.ts';
import { GUIDE_URI } from './guide.ts';
import * as Schemas from './schemas.ts';

/**
 * Adds the `send` tool, which sends a text message to a space.
 *
 * @param server - Server to add the tool to.
 * @param spaces - Spaces the tool can post to.
 * @param formats - Format for each name.
 */
export function registerSend(server: McpServer, spaces: Spaces, formats: Formats): void {
  server.registerTool(
    'send',
    {
      title: 'Send a message',
      description: `Send a text message to a Google Chat space, optionally as a reply in a thread. Read ${GUIDE_URI} first.`,
      inputSchema: z.object({
        text: Schemas.Text,
        format: Schemas.Format,
        space: Schemas.space(spaces),
        threadKey: Schemas.ThreadKey,
      }),
      outputSchema: Schemas.Delivery,
      annotations: Schemas.POSTING,
    },
    async ({ text, format, space, threadKey }) => {
      return Schemas.delivered(await spaces.send(Message.from(formats[format], text), space, Schemas.threadOf(threadKey)));
    },
  );
}
