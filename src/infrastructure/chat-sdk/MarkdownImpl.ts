import { GoogleChatFormatConverter } from '@chat-adapter/gchat';
import { parseMarkdown } from 'chat';
import type { Format } from '../../domain/chat/format.ts';

/**
 * Markdown {@link Format} built on the Chat SDK converter for Google Chat.
 *
 * Adapter pattern: the SDK does the conversion, and this class only fits it to {@link Format}.
 */
export class MarkdownImpl implements Format {
  readonly #converter: GoogleChatFormatConverter;

  private constructor(converter: GoogleChatFormatConverter) {
    this.#converter = converter;
  }

  static create(): MarkdownImpl {
    return new MarkdownImpl(new GoogleChatFormatConverter());
  }

  /** {@inheritDoc Format.render} */
  render(text: string): string {
    return this.#converter.fromAst(parseMarkdown(text));
  }
}
