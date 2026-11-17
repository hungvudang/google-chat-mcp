import type { McpServer } from '@modelcontextprotocol/server';

/** Address of the writing guide resource. */
export const GUIDE_URI = 'google-chat://guide';

/**
 * Principles for posting to Google Chat. It gives no fixed wording or templates on purpose,
 * so the model fits each post to its situation and audience.
 *
 * Formatting source: https://developers.google.com/workspace/chat/format-messages
 */
const GUIDE = `# Posting to Google Chat

People read these posts in a shared space, often on a phone and between other work. Decide the wording, length and shape from what they need to know and do.

## Choosing send or report

- \`send\` posts a message. It suits conversation, quick updates, questions and anything a person would just type.
- \`report\` posts a structured card with a title, optional text, labelled details and link buttons. It suits updates where readers scan several values, such as an incident, a release or a job result.
- If you are unsure, prefer \`send\`. A card for a one-line update feels heavy.

## Writing well

- Say what happened or what is needed first. Add context only when it helps the reader act.
- Write for the people in the space, in their language and vocabulary. Leave out internal detail they cannot use.
- Keep it short. Move long details into a thread reply or link to where they live.
- Mention people only when they need to act.

## Formatting a message

- Write \`send\` text in Markdown.
- Google Chat has no headings, numbered lists or tables, so lean on short paragraphs and bullet lists.
- Mention someone with <users/USER_ID>, or everyone with <users/all>. Plain URLs become links on their own.
- If the text is already in Google Chat markup, set \`format\` to \`chat\` to post it as is.
- Use \`preview\` when the layout matters. It shows exactly what \`send\` will post.

## Shaping a report

- The title says what the report is about. The subtitle can add where or when.
- Text is shown without formatting, so write it as plain sentences without Markdown.
- Each field holds one detail with a short label. Keep values short and put the most useful ones first.
- Links become buttons. Point them at the place where readers can see more or act.

## Threads and pacing

- Reuse a \`threadKey\` to keep follow-ups together. A new key starts a new thread. Both tools accept it.
- A space takes about one post per second, so send one complete post rather than several small ones.
- Very long posts are refused. Split them or link to the full content.
`;

/**
 * Publishes {@link GUIDE} as an MCP resource.
 *
 * @param server - Server to add the resource to.
 */
export function registerGuide(server: McpServer): void {
  server.registerResource(
    'guide',
    GUIDE_URI,
    { title: 'How to post to Google Chat', mimeType: 'text/markdown' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: GUIDE }] }),
  );
}
