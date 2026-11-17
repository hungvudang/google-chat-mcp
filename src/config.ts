import { pino } from 'pino';
import * as z from 'zod';
import { DEFAULT_SPACE, spaceName } from './domain/chat/spaces.ts';
import { blank, presence, startsWith, withoutPrefix } from './shared/strings.ts';

const PREFIX = 'GOOGLE_CHAT_WEBHOOK';
const LEVELS = Object.keys(pino.levels.values) as [pino.Level, ...pino.Level[]];
const TIMEOUT_RULE = 'must be a positive whole number of milliseconds';

const Env = z
  .object({
    GOOGLE_CHAT_DEFAULT_SPACE: z.preprocess(presence, z.string().optional()),
    GOOGLE_CHAT_TIMEOUT_MS: z.preprocess(
      presence,
      z.coerce
        .number({ error: TIMEOUT_RULE })
        .int({ error: TIMEOUT_RULE })
        .positive({ error: TIMEOUT_RULE })
        .default(10_000),
    ),
    LOG_LEVEL: z.preprocess(
      presence,
      z.enum(LEVELS, { error: `must be one of: ${LEVELS.join(', ')}` }).default('info'),
    ),
  })
  .loose()
  .transform((env, ctx) => {
    const webhooks = new Map<string, string>();
    const owners = new Map<string, string>();
    for (const [variable, value] of Object.entries(env)) {
      if (!webhookVariable(variable) || typeof value !== 'string' || blank(value)) {
        continue;
      }
      const name = spaceOf(variable);
      if (blank(name)) {
        ctx.addIssue({ code: 'custom', message: 'needs a space name after the underscore', path: [variable] });
        continue;
      }
      const owner = owners.get(name);
      if (owner !== undefined) {
        ctx.addIssue({ code: 'custom', message: `sets up the ${name} space again, already set by ${owner}. Keep one.`, path: [variable] });
        continue;
      }
      owners.set(name, variable);
      webhooks.set(name, value);
    }
    if (webhooks.size === 0 && ctx.issues.length === 0) {
      ctx.addIssue({ code: 'custom', message: `No webhook is set. Add ${PREFIX} or ${PREFIX}_<NAME>.`, path: [PREFIX] });
    }
    return {
      /** Webhook URL per space name, checked when the spaces are built. */
      webhooks: webhooks as ReadonlyMap<string, string>,
      /** Space used when a caller names none. */
      defaultSpace: env.GOOGLE_CHAT_DEFAULT_SPACE,
      timeoutMs: env.GOOGLE_CHAT_TIMEOUT_MS,
      level: env.LOG_LEVEL,
    };
  });

/**
 * Settings read from the environment at startup. Only their shape is checked here. Whether a
 * webhook or the default space is valid is decided when the spaces are built.
 */
export type Config = z.output<typeof Env>;

/**
 * Reads the settings from environment variables. Variables set to an empty string count as
 * not set.
 *
 * - `GOOGLE_CHAT_WEBHOOK`: webhook of the `default` space.
 * - `GOOGLE_CHAT_WEBHOOK_<NAME>`: webhook of space `<name>`, compared as described in {@link spaceName}.
 * - `GOOGLE_CHAT_DEFAULT_SPACE`: space used when a caller names none.
 * - `GOOGLE_CHAT_TIMEOUT_MS`: HTTP timeout, 10000 by default.
 * - `LOG_LEVEL`: pino level, `info` by default.
 *
 * @param env - Variables to read, usually `process.env`.
 * @returns The settings, or readable issues that never repeat a webhook URL.
 */
export function readConfig(env: NodeJS.ProcessEnv): z.ZodSafeParseResult<Config> {
  return Env.safeParse(env);
}

function webhookVariable(variable: string): boolean {
  return variable === PREFIX || startsWith(variable, `${PREFIX}_`);
}

/** `GOOGLE_CHAT_WEBHOOK` is the default space, `GOOGLE_CHAT_WEBHOOK_DEV_TEAM` is `dev-team`. */
function spaceOf(variable: string): string {
  if (variable === PREFIX) {
    return DEFAULT_SPACE;
  }
  return spaceName(withoutPrefix(variable, `${PREFIX}_`));
}
