import { blank } from '../../shared/strings.ts';
import * as ChatException from './exceptions.ts';
import type { Format } from './format.ts';
import type { Post, PostVisitor } from './post.ts';

/**
 * A plain text message.
 */
export class Message implements Post {
  /** Text in Google Chat markup. */
  readonly text: string;

  private constructor(text: string) {
    this.text = text;
  }

  /**
   * Creates a message from text written in any supported format.
   *
   * @param format - Format `text` is written in.
   * @param text - Text to convert into Google Chat markup.
   * @returns The message.
   * @throws {@link ChatException.Invalid} When there is nothing to show after conversion.
   */
  static from(format: Format, text: string): Message {
    const rendered = format.render(text);
    if (blank(rendered)) {
      throw ChatException.Invalid.emptyText();
    }
    return new Message(rendered);
  }

  /** {@inheritDoc Post.accept} */
  accept<T>(visitor: PostVisitor<T>): T {
    return visitor.message(this);
  }
}
