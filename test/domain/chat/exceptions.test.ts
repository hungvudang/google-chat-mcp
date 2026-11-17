import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as ChatException from '../../../src/domain/chat/exceptions.ts';

const { Invalid, Undelivered } = ChatException;

describe('Invalid', () => {
  it('lists spaces to choose from', () => {
    assert.equal(Invalid.missingSpace(['alerts', 'dev']).message, 'Choose which space to post in: alerts, dev.');
  });

  it('suggests splitting', () => {
    assert.match(Invalid.tooLong().message, /split it/);
  });
});

describe('Undelivered', () => {
  for (const exception of [Undelivered.busy(), Undelivered.slow(10_000), Undelivered.unreachable(), Undelivered.down()]) {
    it(`suggests retry: ${exception.message}`, () => {
      assert.match(exception.message, /try again/i);
    });
  }

  it('reads seconds', () => {
    assert.match(Undelivered.slow(10_000).message, /more than 10 seconds/);
  });

  it('passes on Google reason', () => {
    assert.match(Undelivered.refused('Card is malformed.').message, /It said: Card is malformed\./);
  });
});
