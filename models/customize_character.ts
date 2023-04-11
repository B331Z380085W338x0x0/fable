import {
  Client,
  fql,
  InstanceExpr,
  ResponseExpr,
  StringExpr,
  UserExpr,
} from './fql.ts';

import {
  getGuild,
  getInstance,
  getInventory,
  getUser,
} from './get_user_inventory.ts';

import { Character } from './add_character_to_inventory.ts';

export function customizeCharacter(
  {
    user,
    instance,
    characterId,
    nickname,
    image,
  }: {
    user: UserExpr;
    instance: InstanceExpr;
    characterId: StringExpr;
    nickname?: string;
    image?: string;
  },
): ResponseExpr {
  return fql.Let({
    _match: fql.Match(
      fql.Index('characters_instance_id'),
      characterId,
      fql.Ref(instance),
    ),
    character: fql.If(
      fql.IsNonEmpty(fql.Var('_match')),
      fql.Get(fql.Var('_match')),
      fql.Null(),
    ),
  }, ({ character }) =>
    fql.If(
      fql.IsNull(character),
      {
        ok: false,
        error: 'CHARACTER_NOT_FOUND',
      },
      fql.If(
        fql.Equals( // if user does own the character
          fql.Select(['data', 'user'], character),
          fql.Ref(user),
        ),
        fql.Let({
          updatedCharacter: fql.Update<Character>(fql.Ref(character), {
            nickname: fql.If(
              fql.IsNull(nickname),
              fql.Select(['data', 'nickname'], character, fql.Null()),
              // deno-lint-ignore no-non-null-assertion
              nickname!,
            ),
            image: fql.If(
              fql.IsNull(image),
              fql.Select(['data', 'image'], character, fql.Null()),
              // deno-lint-ignore no-non-null-assertion
              image!,
            ),
          }),
        }, ({ updatedCharacter }) => ({
          ok: true,
          character: fql.Ref(updatedCharacter),
        })),
        {
          ok: false,
          error: 'CHARACTER_NOT_OWNED',
          character: fql.Ref(character),
        },
      ),
    ));
}

export default function (client: Client): {
  indexers?: (() => Promise<void>)[];
  resolvers?: (() => Promise<void>)[];
} {
  return {
    resolvers: [
      fql.Resolver({
        client,
        name: 'customize_character',
        lambda: (
          userId: string,
          guildId: string,
          characterId: string,
          nickname?: string,
          image?: string,
        ) => {
          return fql.Let(
            {
              user: getUser(userId),
              guild: getGuild(guildId),
              instance: getInstance(fql.Var('guild')),
              inventory: getInventory({
                user: fql.Var('user'),
                instance: fql.Var('instance'),
              }),
            },
            ({ user, instance }) =>
              customizeCharacter({
                user,
                instance,
                characterId,
                nickname,
                image,
              }),
          );
        },
      }),
    ],
  };
}