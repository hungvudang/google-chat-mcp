import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as ChatException from '../../../src/domain/chat/exceptions.ts';
import { chat, type Format } from '../../../src/domain/chat/format.ts';
import { Message } from '../../../src/domain/chat/message.ts';
import type { PostVisitor } from '../../../src/domain/chat/post.ts';

describe('Message', () => {
  describe('from', () => {
    it('applies format', () => {
      const shout: Format = { render: (text) => text.toUpperCase() };
      assert.equal(Message.from(shout, 'hi').text, 'HI');
    });

    it('needs text', () => {
      assert.throws(() => Message.from(chat, '  \n'), ChatException.Invalid);
    });

    it('checks rendered text', () => {
      const empty: Format = { render: () => ' ' };
      assert.throws(() => Message.from(empty, 'hi'), ChatException.Invalid);
    });
  });

  describe('accept', () => {
    it('visits as message', () => {
      const visitor: PostVisitor<string> = { message: () => 'message', report: () => 'report' };
      assert.equal(Message.from(chat, 'hi').accept(visitor), 'message');
    });
  });
});
