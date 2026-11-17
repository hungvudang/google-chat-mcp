# google-chat-mcp

Post to Google Chat from any MCP client through incoming webhooks.

Requires Node.js 22.18 or later.

## Setup

1. In Google Chat, open the space and go to **Apps & integrations > Webhooks > Add webhook**. Copy the URL. Anyone with this URL can post to the space, so keep it private.

2. Add the server to your MCP client's config:

   ```json
   {
     "mcpServers": {
       "google-chat": {
         "command": "npx",
         "args": ["-y", "@hungvudang/google-chat-mcp"],
         "env": {
           "GOOGLE_CHAT_WEBHOOK": "https://chat.googleapis.com/v1/spaces/..."
         }
       }
     }
   }
   ```

   To post to several spaces, add one `GOOGLE_CHAT_WEBHOOK_<NAME>` per space to `env`, for example `GOOGLE_CHAT_WEBHOOK_ALERTS`.

   Some clients add servers from the command line instead. With Claude Code, for example:

   ```bash
   claude mcp add google-chat \
     -e GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/v1/spaces/... \
     -- npx -y @hungvudang/google-chat-mcp
   ```

## Configuration

| Variable | Description |
|---|---|
| `GOOGLE_CHAT_WEBHOOK` | Webhook of the `default` space |
| `GOOGLE_CHAT_WEBHOOK_<NAME>` | Webhook of another space. `GOOGLE_CHAT_WEBHOOK_DEV_TEAM` adds a space called `dev-team` |
| `GOOGLE_CHAT_DEFAULT_SPACE` | Space to use when none is named. Defaults to `default`, or to the only space if there is just one |
| `GOOGLE_CHAT_TIMEOUT_MS` | How long to wait for Google Chat. Default `10000` |
| `LOG_LEVEL` | `trace`, `debug`, `info`, `warn`, `error` or `fatal`. Default `info` |

At least one webhook is required.

## Usage

Ask your assistant to post something, for example *"tell the alerts space that the deploy is done"*.

| Tool | What it does |
|---|---|
| `send` | Sends a message to a space, optionally as a reply in a thread |
| `report` | Sends a card with a title, text, labelled details and link buttons |
| `preview` | Shows how a message will look, without sending it |

The assistant writes in Markdown and the server converts it to Google Chat formatting. The server also gives the assistant a short writing guide so messages read like a teammate wrote them.

## Development

```bash
npm install
npm test
npm run build
cp env/.env.local .env   # then fill in a webhook
node --env-file=.env build/index.js
```

## License

MIT
