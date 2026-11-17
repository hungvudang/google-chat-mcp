import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/server';
import type { Formats } from '../domain/chat/format.ts';
import type { Spaces } from '../domain/chat/spaces.ts';
import { GUIDE_URI, registerGuide } from './guide.ts';
import { registerPreview } from './preview.ts';
import { registerReport } from './report.ts';
import { registerSend } from './send.ts';

const { version } = createRequire(import.meta.url)('../../package.json') as { version: string };

/**
 * Builds the MCP server with the Google Chat tools and the writing guide.
 *
 * Tools just throw when something goes wrong. The SDK turns the exception message into an
 * error result, and chat exception messages are written to be shown as is.
 *
 * @param spaces - Spaces the tools can post to.
 * @param formats - Format for each name.
 * @returns The server, ready to connect.
 */
export function createServer(spaces: Spaces, formats: Formats): McpServer {
  const server = new McpServer(
    { name: 'google-chat', version },
    {
      capabilities: { tools: {}, resources: {} },
      instructions: [
        `Posts to these Google Chat spaces: ${spaces.names.join(', ')}.`,
        'Use send for a conversational message and report for a structured update with details.',
        `Read ${GUIDE_URI} before posting. It explains how to write for the people in the space.`,
      ].join(' '),
    },
  );
  registerSend(server, spaces, formats);
  registerReport(server, spaces);
  registerPreview(server, formats);
  registerGuide(server);
  return server;
}
