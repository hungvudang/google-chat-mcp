#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { pino, type Logger } from 'pino';
import * as Config from './config.ts';
import { chat } from './domain/chat/format.ts';
import type { Space } from './domain/chat/space.ts';
import { Spaces } from './domain/chat/spaces.ts';
import { MarkdownImpl } from './infrastructure/chat-sdk/MarkdownImpl.ts';
import { PayloadImpl } from './infrastructure/chat-sdk/PayloadImpl.ts';
import { SpaceImpl } from './infrastructure/http/SpaceImpl.ts';
import { Webhook } from './infrastructure/http/webhook.ts';
import { createServer } from './mcp/server.ts';

/**
 * Starts the server. Any setting it cannot work with stops it before the first request.
 *
 * @param env - Environment variables to read the settings from.
 * @param log - Logger, which writes to stderr because stdout carries MCP messages.
 * @throws {@link Config.Invalid} When the settings are malformed.
 * @throws {@link ChatException.Invalid} When a webhook or the default space is invalid.
 */
function start(env: NodeJS.ProcessEnv, log: Logger): void {
  const settings = Config.read(env);
  log.level = settings.level;
  const payloads = PayloadImpl.create();
  const connected = new Map<string, Space>();
  for (const [name, url] of settings.webhooks) {
    connected.set(name, SpaceImpl.of(Webhook.parse(url, name), payloads, log, settings.timeoutMs));
  }
  const spaces = Spaces.of(connected, settings.defaultSpace);
  serveStdio(() => createServer(spaces, { markdown: MarkdownImpl.create(), chat }, log), {
    onerror: (exception) => log.error({ err: exception }, 'mcp.failure'),
  });
  log.info({ spaces: spaces.names, defaultSpace: spaces.default }, 'server.started');
}

start(process.env, pino(pino.destination(2)));
