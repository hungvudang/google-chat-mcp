import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Delivery, Space } from '../../../src/domain/chat/space.ts';
import * as ChatException from '../../../src/domain/chat/exceptions.ts';
import { chat } from '../../../src/domain/chat/format.ts';
import { Message } from '../../../src/domain/chat/message.ts';
import { Spaces, spaceName } from '../../../src/domain/chat/spaces.ts';

const HI = Message.from(chat, 'hi');

function space(name: string): Space {
  return { send: async (): Promise<Delivery> => ({ name, thread: undefined }) };
}

function spaces(names: string[], defaultSpace?: string): Spaces {
  return Spaces.of(new Map(names.map((name) => [name, space(name)])), defaultSpace);
}

describe('spaceName', () => {
  it('ignores case, spaces and underscores', () => {
    assert.equal(spaceName(' DEV_TEAM '), 'dev-team');
  });
});

describe('Spaces', () => {
  describe('of', () => {
    it('needs a space', () => {
      assert.throws(() => spaces([]), ChatException.Invalid);
    });

    it('needs known default', () => {
      assert.throws(() => spaces(['dev', 'alerts'], 'ops'), /default space isn't set up. Choose one of: alerts, dev/);
    });

    it('sorts names', () => {
      assert.deepEqual(spaces(['dev', 'alerts']).names, ['alerts', 'dev']);
    });

    it('defaults to given space', () => {
      assert.equal(spaces(['default', 'dev'], 'dev').default, 'dev');
    });

    it('defaults to default space', () => {
      assert.equal(spaces(['default', 'dev']).default, 'default');
    });

    it('defaults to only space', () => {
      assert.equal(spaces(['dev']).default, 'dev');
    });

    it('has no default among many', () => {
      assert.equal(spaces(['alerts', 'dev']).default, undefined);
    });
  });

  describe('send', () => {
    it('targets named space', async () => {
      assert.equal((await spaces(['alerts', 'dev'], 'dev').send(HI, 'alerts')).name, 'alerts');
    });

    it('uses default', async () => {
      assert.equal((await spaces(['alerts', 'dev'], 'dev').send(HI)).name, 'dev');
    });

    it('needs space without default', () => {
      assert.throws(() => spaces(['alerts', 'dev']).send(HI), /Choose which space to post in: alerts, dev/);
    });

    it('matches loosely written names', async () => {
      assert.equal((await spaces(['dev-team', 'alerts'], 'DEV_TEAM').send(HI, 'Alerts')).name, 'alerts');
    });

    it('fails on unknown space', () => {
      assert.throws(() => spaces(['dev']).send(HI, 'ops'), /That space isn't set up. Choose one of: dev/);
    });
  });
});
