import { lowercase, replace, trim } from '../../shared/strings.ts';
import * as ChatException from './exceptions.ts';
import type { Post } from './post.ts';
import type { Delivery, Space } from './space.ts';
import type { Thread } from './thread.ts';

/** Name given to the space configured without a name. */
export const DEFAULT_SPACE = 'default';

/**
 * The form every space name is compared in, so `DEV_TEAM`, `Dev-Team` and `dev-team` match.
 *
 * @param raw - Name as written in config or by a caller.
 * @returns The name in lower case, trimmed, with `_` turned into `-`.
 */
export function spaceName(raw: string): string {
  return replace(lowercase(trim(raw)), '_', '-');
}

/**
 * The Google Chat spaces the server can send to, by name.
 *
 * Facade pattern: callers hand over a post and, optionally, a space name. This class picks
 * the right {@link Space} and passes the post on, so callers never deal with spaces directly.
 */
export class Spaces {
  /** Space names in alphabetical order. */
  readonly names: readonly string[];
  /** Space used when a caller names none, if there is one. */
  readonly default: string | undefined;
  readonly #spaces: ReadonlyMap<string, Space>;

  private constructor(spaces: ReadonlyMap<string, Space>, names: readonly string[], defaultSpace: string | undefined) {
    this.#spaces = spaces;
    this.names = names;
    this.default = defaultSpace;
  }

  /**
   * Creates the set of spaces and decides which one is the default.
   *
   * Names are compared through {@link spaceName}. The default is `defaultSpace` when given.
   * Otherwise it is the space named `default` if configured, or the only space if there is just
   * one. With several spaces and none of these, callers must always name a space.
   *
   * @param spaces - Space for each name, at least one.
   * @param defaultSpace - Space to use when a caller names none.
   * @returns The spaces.
   * @throws {@link ChatException.Invalid} When there is no space or `defaultSpace` is unknown.
   */
  static of(spaces: ReadonlyMap<string, Space>, defaultSpace?: string): Spaces {
    const named = new Map([...spaces].map(([name, space]) => [spaceName(name), space]));
    const names = Object.freeze([...named.keys()].sort());
    if (names.length === 0) {
      throw ChatException.Invalid.noSpaces();
    }
    if (defaultSpace === undefined) {
      return new Spaces(named, names, defaultOf(names));
    }
    if (!named.has(spaceName(defaultSpace))) {
      throw ChatException.Invalid.unknownDefaultSpace(names);
    }
    return new Spaces(named, names, spaceName(defaultSpace));
  }

  /**
   * Sends `post` to a space.
   *
   * @param post - Message or report to send.
   * @param name - Space name. The default space is used when left out.
   * @param thread - Thread to post in.
   * @returns What Google Chat reported back.
   * @throws {@link ChatException.Invalid} When the space is unknown, or left out with no default,
   *   or the post is too large.
   * @throws {@link ChatException.Undelivered} When the post did not reach the space.
   */
  send(post: Post, name?: string, thread?: Thread): Promise<Delivery> {
    const target = name ?? this.default;
    if (target === undefined) {
      throw ChatException.Invalid.missingSpace(this.names);
    }
    const space = this.#spaces.get(spaceName(target));
    if (space === undefined) {
      throw ChatException.Invalid.unknownSpace(this.names);
    }
    return space.send(post, thread);
  }
}

function defaultOf(names: readonly string[]): string | undefined {
  if (names.includes(DEFAULT_SPACE)) {
    return DEFAULT_SPACE;
  }
  if (names.length === 1) {
    return names[0];
  }
  return undefined;
}
