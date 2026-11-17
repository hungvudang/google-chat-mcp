import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { FORMATS } from '../domain/chat/format.ts';
import type { Delivery as Delivered } from '../domain/chat/space.ts';
import type { Spaces } from '../domain/chat/spaces.ts';
import { Thread } from '../domain/chat/thread.ts';
import { presence } from '../shared/strings.ts';
import { GUIDE_URI } from './guide.ts';

export const Text = z.string().describe('What to post, written for the people in the space.');

export const Format = z
  .enum(FORMATS)
  .default('markdown')
  .describe(`How the text is written: markdown (default), or chat if it already uses Google Chat markup. See ${GUIDE_URI}.`);

/**
 * Some clients send `""` for arguments they leave out.
 *
 * @returns A schema where blank text counts as left out.
 */
function optional() {
  return z.preprocess(presence, z.string().optional());
}

export const ThreadKey = optional()
  .transform(threadOf)
  .describe('Keeps related posts in one thread. Reuse a key to reply, or pick a new one to start a thread.');

/** Space argument. The names come from the config so the model only sees real spaces. */
export function space(spaces: Spaces) {
  const description = [`Which space to post in: ${spaces.names.join(', ')}.`];
  if (spaces.default !== undefined) {
    description.push(`Leave it out to use ${spaces.default}.`);
  }
  return optional().describe(description.join(' '));
}

export const Delivery = z.object({
  name: z.string().optional().describe('Created message, spaces/<SPACE>/messages/<ID>.'),
  thread: z.string().optional().describe('Thread of the message, spaces/<SPACE>/threads/<ID>.'),
});

/** Hints shared by every tool that posts to a space. */
export const POSTING: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

/**
 * Thread for an optional key from a tool call.
 *
 * @param key - Key the caller picked, if any.
 * @returns The thread, or `undefined` to post outside a thread.
 */
function threadOf(key: string | undefined): Thread | undefined {
  if (key === undefined) {
    return undefined;
  }
  return Thread.of(key);
}

/** Tool result for a sent post. */
export function delivered(delivery: Delivered): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(delivery) }], structuredContent: { ...delivery } };
}
