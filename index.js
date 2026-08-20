const { Client, GatewayIntentBits, Events } = require("discord.js");
const interactions = require("./interactions");
const config = require("./config");
const { deckData } = require("./logic/deck");
const { cardData } = require("./logic/card");
const { deckInstanceData } = require("./logic/deck-instance");

const client = new Client({
  intents: [
		GatewayIntentBits.Guilds,
	],
});

client.once(Events.ClientReady, () => {
  console.log("Discord bot is ready! 🤖");
});

client.on(Events.GuildAvailable, async (guild) => {
  await interactions.deploy({ guildId: guild.id });
  deckData.register({ guildId: guild.id })
  cardData.register({ guildId: guild.id })
  deckInstanceData.register({ guildId: guild.id })
});

client.on(Events.InteractionCreate, async (interaction) => {
  const handled = await interactions.handle(interaction);
  if (!handled) {
    console.warn('Unhandled interaction', interaction);
  }
});

client.login(config.DISCORD_TOKEN);
