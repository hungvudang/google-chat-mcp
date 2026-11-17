import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { Report } from '../domain/chat/report.ts';
import type { Spaces } from '../domain/chat/spaces.ts';
import { GUIDE_URI } from './guide.ts';
import type { Guard } from './guard.ts';
import * as Schemas from './schemas.ts';

const Field = z.object({
  label: z.string().describe('Short name of the detail.'),
  value: z.string().describe('The detail itself.'),
});

const Link = z.object({
  label: z.string().describe('Button text.'),
  url: z.string().describe('Page the button opens.'),
});

/**
 * Adds the `report` tool, which sends a structured report to a space.
 *
 * @param server - Server to add the tool to.
 * @param spaces - Spaces the tool can post to.
 * @param guard - Keeps library errors away from the model.
 */
export function registerReport(server: McpServer, spaces: Spaces, guard: Guard): void {
  server.registerTool(
    'report',
    {
      title: 'Send a report',
      description: `Send a structured report to a Google Chat space: a title, optional plain text, labelled details and link buttons. Read ${GUIDE_URI} first.`,
      inputSchema: z.object({
        title: z.string().describe('What the report is about, in one line.'),
        subtitle: z.string().optional().describe('Short context shown under the title.'),
        text: z.string().optional().describe('A few plain sentences, without Markdown.'),
        fields: z.array(Field).optional().describe('Labelled details, shown one per line.'),
        links: z.array(Link).optional().describe('Buttons that open related pages.'),
        space: Schemas.space(spaces),
        threadKey: Schemas.ThreadKey,
      }),
      outputSchema: Schemas.Delivery,
      annotations: Schemas.POSTING,
    },
    guard('report', async ({ space, threadKey, ...content }) => {
      return Schemas.delivered(await spaces.send(Report.of(content), space, threadKey));
    }),
  );
}
