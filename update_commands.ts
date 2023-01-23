import { load as Dotenv } from 'https://deno.land/std@0.173.0/dotenv/mod.ts';

import { Manifest } from './src/types.ts';

try {
  await Dotenv({ export: true, allowEmptyValues: true });
} catch {
  //
}

const APP_ID = Deno.env.get('APP_ID');

const BOT_TOKEN = Deno.env.get('BOT_TOKEN');

const GUILD_ID = Deno.env.get('GUILD_ID');

if (!APP_ID) {
  throw new Error('APP_ID is not defined');
}

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not defined');
}

enum Type {
  'SUB_COMMAND' = 1,
  'SUB_COMMAND_GROUP' = 2,
  'STRING' = 3,
  'INTEGER' = 4, //  Includes all channel types + categories
  'BOOLEAN' = 5,
  'USER' = 6,
  'CHANNEL' = 7, // Includes all channel types + categories
  'ROLE' = 8,
  'MENTIONABLE' = 9, // Includes users and roles
  'NUMBER' = 10, // Any double between -2^53 and 2^53
  'ATTACHMENT' = 11, // attachment object
}

enum Permission {
  'OWNER' = 0,
  'ADMINISTRATORS' = 1 << 3,
  'MANAGE_GUILD' = 1 << 5,
}

const Option = (
  { name, description, type, optional }: {
    name: string;
    description: string;
    type: Type;
    optional?: boolean;
  },
) => ({
  name,
  description,
  type: type.valueOf(),
  required: !optional,
});

const Command = ({
  name,
  description,
  options,
  aliases,
  defaultPermission,
  devOnly,
}: {
  name: string;
  description: string;
  options?: ReturnType<typeof Option>[];
  aliases?: string[];
  defaultPermission?: Permission;
  devOnly?: boolean;
}) => {
  if (devOnly && !GUILD_ID) {
    return [];
  }

  if (devOnly) {
    description = `${description} (Developer Only)`;
  }

  const commands = [{
    name,
    description,
    'default_member_permissions': defaultPermission,
    options,
  }];

  aliases?.forEach((alias) =>
    commands.push({
      ...commands[0],
      name: alias,
    })
  );

  return commands;
};

type CommandsArray = ReturnType<typeof Command>;

const Pack = (path: string): CommandsArray => {
  const data = Deno.readTextFileSync(path + '/manifest.json');
  const manifest: Manifest = JSON.parse(data);

  const commands: CommandsArray = [];

  if (manifest.commands) {
    Object.entries(manifest.commands).forEach(([name, command]) => {
      const options = command.options;

      const description = `${command.description} (${
        manifest.title || manifest.id
      })`;

      commands.push(...Command({
        name,
        description,
        options: options.map((opt) => (Option({
          name,
          description,
          type: Type[opt.type.toUpperCase() as keyof typeof Type],
          optional: !opt.required,
        }))),
      }));
    });
  }

  return commands;
};

async function put(commands: CommandsArray): Promise<void> {
  if (!GUILD_ID) {
    console.log('Updating global commands for production bot\n\n');
  } else {
    console.log('Updating guild commands for dev bot\n\n');
  }

  const url = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (response.status !== 200) {
    throw new Error(JSON.stringify(await response.json(), undefined, 2));
  } else {
    console.log(response.status, response.statusText);
  }
}

put([
  // standard gacha commands
  // uses characters and media from all packs
  ...Command({
    name: 'search',
    aliases: ['anime', 'manga'],
    description: 'Search for an anime/manga',
    options: [
      Option({
        name: 'query',
        description: 'The title for an anime/manga',
        type: Type.STRING,
      }),
      Option({
        name: 'debug',
        description: 'Display the nerdy stuff',
        type: Type.BOOLEAN,
        optional: true,
      }),
    ],
  }),
  ...Command({
    name: 'character',
    description: 'Search for a character',
    options: [
      Option({
        name: 'query',
        description: 'The title of the character',
        type: Type.STRING,
      }),
      Option({
        name: 'debug',
        description: 'Display the nerdy stuff',
        type: Type.BOOLEAN,
        optional: true,
      }),
    ],
  }),
  ...Command({
    name: 'music',
    description: 'Search for the OP/ED and theme songs of an anime',
    aliases: ['songs', 'themes'],
    options: [
      Option({
        name: 'query',
        description: 'The title for an anime/manga',
        type: Type.STRING,
      }),
    ],
  }),
  ...Command({
    name: 'gacha',
    description: 'An experimental/ephemeral gacha command',
    aliases: ['w', 'pull', 'roll'],
  }),
  ...Command({
    name: 'force_pull',
    description: 'Force a gacha pull',
    defaultPermission: Permission.ADMINISTRATORS,
    devOnly: true,
    options: [
      Option({
        name: 'id',
        description: 'The id of the character',
        type: Type.STRING,
      }),
    ],
  }),
  // pack management commands
  ...Command({
    name: 'packs',
    description: 'Pack management commands',
    defaultPermission: Permission.MANAGE_GUILD,
    options: [
      Option({
        name: 'builtin',
        description: 'List all the builtin packs',
        type: Type.SUB_COMMAND,
        optional: true,
      }),
      Option({
        name: 'manual',
        description: 'List all the manually instated packs',
        type: Type.SUB_COMMAND,
        optional: true,
      }),
    ],
  }),
  // non-standard commands (pack commands)
  ...Pack('./packs/anilist'),
  ...Pack('./packs/x'),
]);