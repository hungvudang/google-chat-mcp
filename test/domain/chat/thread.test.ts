import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as ChatException from '../../../src/domain/chat/exceptions.ts';
import { Thread } from '../../../src/domain/chat/thread.ts';

describe('Thread', () => {
  describe('of', () => {
    it('keeps key', () => {
      assert.equal(Thread.of('release-42').key, 'release-42');
    });

    it('needs key', () => {
      assert.throws(() => Thread.of(' '), ChatException.Invalid);
    });
  });
});
