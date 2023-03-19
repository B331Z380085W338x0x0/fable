// deno-lint-ignore-file no-explicit-any

import { assertEquals } from 'https://deno.land/std@0.179.0/testing/asserts.ts';

import {
  returnsNext,
  stub,
} from 'https://deno.land/std@0.179.0/testing/mock.ts';

import packs from '../src/packs.ts';

import trade from '../src/trade.ts';

import { AniListCharacter } from '../packs/anilist/types.ts';

Deno.test('gift', async (test) => {
  await test.step('normal', async () => {
    const character: AniListCharacter = {
      id: '1',
      name: {
        full: 'title',
      },
    };

    const fetchStub = stub(
      globalThis,
      'fetch',
      returnsNext([
        {
          ok: true,
          text: (() =>
            Promise.resolve(JSON.stringify({
              data: {
                giveCharacters: {
                  ok: true,
                },
              },
            }))),
        } as any,
        {
          ok: true,
          text: (() =>
            Promise.resolve(JSON.stringify({
              data: {
                Page: {
                  characters: [character],
                },
              },
            }))),
        } as any,
      ]),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    try {
      const message = await trade.gift({
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharacterId: 'anilist:1',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          content: '<@target_id>',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description: '<@user_id> sent you a gift',
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1061016360190222466><:no_star:1061016360190222466><:no_star:1061016360190222466><:no_star:1061016360190222466>',
              fields: [
                {
                  name: 'title',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:add:1085034731810332743>',
                },
              ],
              thumbnail: {
                url: 'undefined/external/?size=thumbnail',
              },
            },
          ],
        },
      });
    } finally {
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
    }
  });
});

Deno.test('trade', async (test) => {
  await test.step('normal', async () => {
    const character: AniListCharacter = {
      id: '1',
      name: {
        full: 'title',
      },
    };

    const character2: AniListCharacter = {
      id: '2',
      name: {
        full: 'title 2',
      },
    };

    const fetchStub = stub(
      globalThis,
      'fetch',
      returnsNext([
        {
          ok: true,
          text: (() =>
            Promise.resolve(JSON.stringify({
              data: {
                tradeCharacters: {
                  ok: true,
                },
              },
            }))),
        } as any,
        {
          ok: true,
          text: (() =>
            Promise.resolve(JSON.stringify({
              data: {
                Page: {
                  characters: [character, character2],
                },
              },
            }))),
        } as any,
      ]),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    try {
      const message = await trade.accepted({
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharacterId: 'anilist:1',
        takeCharacterId: 'anilist:2',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          content: '<@user_id>',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description: '<@target_id> accepted your offer',
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1061016360190222466><:no_star:1061016360190222466><:no_star:1061016360190222466><:no_star:1061016360190222466>',
              fields: [
                {
                  name: 'title 2',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:add:1085034731810332743>',
                },
              ],
              thumbnail: {
                url: 'undefined/external/?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1061016360190222466><:no_star:1061016360190222466><:no_star:1061016360190222466><:no_star:1061016360190222466>',
              fields: [
                {
                  name: 'title',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1085033678180208641>',
                },
              ],
              thumbnail: {
                url: 'undefined/external/?size=thumbnail',
              },
            },
          ],
        },
      });
    } finally {
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
    }
  });
});