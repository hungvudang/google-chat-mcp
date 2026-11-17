/**
 * Exceptions of the chat context.
 *
 * Import the module as `ChatException` so call sites read `ChatException.Invalid.emptyText()`.
 * Each exception comes from a static factory named after the situation. Its message is a plain
 * sentence the assistant can pass on as is. HTTP statuses go to the logs, not into messages.
 */

/**
 * Base of every chat exception. Its message never contains a webhook URL, so it is safe to show.
 */
abstract class Fault extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Input that breaks a rule, such as an empty message or an unknown space.
 */
export class Invalid extends Fault {
  private constructor(message: string) {
    super(message);
  }

  /** The message has no visible text. */
  static emptyText(): Invalid {
    return new Invalid('The message is empty. Write something to send.');
  }

  /** The post is bigger than Google Chat accepts. */
  static tooLong(): Invalid {
    return new Invalid('This is too long for Google Chat. Shorten it or split it into several messages.');
  }

  /** A thread key was given but is blank. */
  static emptyThreadKey(): Invalid {
    return new Invalid('The thread key is empty. Leave it out to post outside a thread.');
  }

  /** The report has no title. */
  static emptyTitle(): Invalid {
    return new Invalid('The report needs a title.');
  }

  /** The report has neither text nor any detail. */
  static emptyReport(): Invalid {
    return new Invalid('The report has no details. Add some text or at least one field.');
  }

  /** A report detail is missing its label or value. */
  static emptyField(): Invalid {
    return new Invalid('Every field needs both a label and a value.');
  }

  /** A report link is missing its label or is not a web address. */
  static badLink(): Invalid {
    return new Invalid('Every link needs a label and a web address starting with https:// or http://.');
  }

  /** No space was named and there is no default one. */
  static missingSpace(names: readonly string[]): Invalid {
    return new Invalid(`Choose which space to post in: ${names.join(', ')}.`);
  }

  /** The named space is not configured. */
  static unknownSpace(names: readonly string[]): Invalid {
    return new Invalid(`That space isn't set up. Choose one of: ${names.join(', ')}.`);
  }

  /** The configured default space is not one of the spaces. */
  static unknownDefaultSpace(names: readonly string[]): Invalid {
    return new Invalid(`The default space isn't set up. Choose one of: ${names.join(', ')}.`);
  }

  /** No space is configured. */
  static noSpaces(): Invalid {
    return new Invalid('No Google Chat space is set up. Add at least one webhook.');
  }

  /** The webhook configured for `space` is not a Google Chat webhook link. */
  static notWebhook(space: string): Invalid {
    return new Invalid(`The ${space} webhook isn't a Google Chat webhook link. Copy it again from the space's webhook settings.`);
  }

  /** The webhook configured for `space` lacks its key or token. */
  static incompleteWebhook(space: string): Invalid {
    return new Invalid(`The ${space} webhook link is incomplete. Copy the whole link again from the space's webhook settings.`);
  }
}

/**
 * The post did not reach the space. The exception message says whether trying again may help.
 */
export class Undelivered extends Fault {
  private constructor(message: string) {
    super(message);
  }

  /** The space gets more messages than Google Chat allows, about one per second. */
  static busy(): Undelivered {
    return new Undelivered('Google Chat is getting too many messages for this space. Wait a moment and try again.');
  }

  /** Google Chat took longer than `timeoutMs` to answer. */
  static slow(timeoutMs: number): Undelivered {
    return new Undelivered(`Google Chat took more than ${timeoutMs / 1000} seconds to answer. Try again shortly.`);
  }

  /** The network request itself failed. */
  static unreachable(): Undelivered {
    return new Undelivered("Couldn't reach Google Chat. Check the network connection and try again.");
  }

  /** Google Chat had a problem on its side. */
  static down(): Undelivered {
    return new Undelivered('Google Chat is having trouble right now. Try again in a few minutes.');
  }

  /** The webhook was deleted or its token no longer matches. */
  static revoked(): Undelivered {
    return new Undelivered("This space's webhook no longer works. Ask a space manager for a new webhook link.");
  }

  /** Google Chat refused the request and said why, for example a bad token or a card it cannot show. */
  static refused(reason: string): Undelivered {
    return new Undelivered(`Google Chat didn't accept this. It said: ${reason}`);
  }

  /** Google Chat refused the request without saying why. */
  static unexplained(): Undelivered {
    return new Undelivered(
      "Google Chat didn't accept this and gave no reason. If it keeps happening, the space's webhook may need replacing.",
    );
  }
}
