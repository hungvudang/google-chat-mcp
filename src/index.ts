#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { pino } from 'pino';
import * as z from 'zod';
import { readConfig } from './config.ts';
import { chat } from './domain/chat/format.ts';
import type { Space } from './domain/chat/space.ts';
import { Spaces } from './domain/chat/spaces.ts';
import { MarkdownImpl } from './infrastructure/chat-sdk/MarkdownImpl.ts';
import { PayloadImpl } from './infrastructure/chat-sdk/PayloadImpl.ts';
import { SpaceImpl } from './infrastructure/http/SpaceImpl.ts';
import { Webhook } from './infrastructure/http/webhook.ts';
import { createServer } from './mcp/server.ts';

/**
 * stdout carries the MCP messages, so every log line goes to stderr.
 */
const log = pino(pino.destination(2));

process.on('uncaughtException', (exception) => {
  log.fatal({ err: exception }, 'server.crashed');
  process.exit(1);
});

const config = readConfig(process.env);
if (!config.success) {
  log.fatal({ issues: z.prettifyError(config.error) }, 'config.invalid');
  process.exit(1);
}
const { webhooks, defaultSpace, timeoutMs, level } = config.data;
log.level = level;

const payloads = PayloadImpl.create();
const configured = new Map<string, Space>();
const issues: string[] = [];
for (const [name, url] of webhooks) {
  try {
    configured.set(name, SpaceImpl.of(Webhook.parse(url, name), payloads, log, timeoutMs));
  } catch (exception) {
    issues.push((exception as Error).message);
  }
}
let spaces: Spaces | undefined;
if (issues.length === 0) {
  try {
    spaces = Spaces.of(configured, defaultSpace);
  } catch (exception) {
    issues.push((exception as Error).message);
  }
}
if (spaces === undefined) {
  log.fatal({ issues: issues.join('\n') }, 'config.invalid');
  process.exit(1);
}

serveStdio(() => createServer(spaces, { markdown: MarkdownImpl.create(), chat }), {
  onerror: (exception) => log.error({ err: exception }, 'mcp.failure'),
});
log.info({ spaces: spaces.names, defaultSpace: spaces.default }, 'server.started');
