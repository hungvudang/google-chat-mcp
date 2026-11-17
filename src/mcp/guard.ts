import type { CallToolResult } from '@modelcontextprotocol/server';
import type { Logger } from 'pino';
import { Fault } from '../domain/chat/exceptions.ts';

const UNEXPECTED = 'Something went wrong on our side. If it keeps happening, ask whoever set this up for help.';

/** What a tool runs for each call. */
export type Handler<A> = (args: A) => Promise<CallToolResult>;

/** Makes a tool safe to call, see {@link guard}. */
export type Guard = <A>(tool: string, handler: Handler<A>) => Handler<A>;

/**
 * Keeps library errors away from the model. Chat exceptions are written to be shown, others are not.
 *
 * Decorator pattern, so each tool handler stays unaware of it.
 *
 * @param log - Logger for unexpected failures.
 * @returns The guard to wrap every tool handler with.
 */
export function guard(log: Logger): Guard {
  return (tool, handler) => async (args) => {
    try {
      return await handler(args);
    } catch (exception) {
      if (exception instanceof Fault) {
        return failure(exception.message);
      }
      log.error({ err: exception, tool }, 'tool.failed');
      return failure(UNEXPECTED);
    }
  };
}

/**
 * Tells the model the call failed, so it does not treat `text` as the tool's answer.
 *
 * @param text - What the model may pass on.
 * @returns The failed result.
 */
function failure(text: string): CallToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}
