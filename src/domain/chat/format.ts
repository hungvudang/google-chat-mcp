/**
 * The markup a caller writes a message in.
 *
 * Strategy pattern: each format turns the caller's text into Google Chat markup
 * (`*bold*`, `_italic_`, `<url|label>`), so sending never has to care which one was used.
 */
export interface Format {
  /**
   * Converts `text` into Google Chat markup.
   *
   * @param text - Text written in this format.
   * @returns The same text in Google Chat markup.
   */
  render(text: string): string;
}

export const FORMATS = ['markdown', 'chat'] as const;

type FormatName = (typeof FORMATS)[number];

export type Formats = Readonly<Record<FormatName, Format>>;

/**
 * Text already in Google Chat markup. It is sent as is.
 */
export const chat: Format = {
  render(text: string): string {
    return text;
  },
};
