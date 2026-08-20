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

async function setupGuild(guild) {
  await interactions.deploy({ guildId: guild.id });
  deckData.register({ guildId: guild.id })
  cardData.register({ guildId: guild.id })
  deckInstanceData.register({ guildId: guild.id })
}

// GuildAvailable covers guilds the bot is already in (Discord sends them as
// unavailable stubs in the initial READY payload, then flips them available
// shortly after). GuildCreate covers the bot joining a brand-new guild while
// already running - a separate event, only emitted for that case.
client.on(Events.GuildAvailable, setupGuild);
client.on(Events.GuildCreate, setupGuild);

client.on(Events.InteractionCreate, async (interaction) => {
  const handled = await interactions.handle(interaction);
  if (!handled) {
    console.warn('Unhandled interaction', interaction);
  }
});

client.login(config.DISCORD_TOKEN);
