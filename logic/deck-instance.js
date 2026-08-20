const discord = require("discord.js");
const crud = require("../crud");
const guilds = require("../guild");
const db = require("../db");

/**
 * Deck instance data - a single "draw pile" spawned from a deck via /show-deck.
 * @typedef {Object} DeckInstanceData
 * @property {string} id The ID.
 * @property {guilds.GuildInfo} guild The guild.
 * @property {string} deckId The deck this instance was created from.
 * @property {string} creatorId The ID of the user who created this instance.
 * @property {"public" | "private"} visibility Who is allowed to draw from this instance.
 * @property {string[]} drawnCardIds IDs of cards already drawn from this instance.
 */

/**
 * @type {crud.Crud<DeckInstanceData, { guildId: string }>}
 */
const deckInstanceData = crud.crudDefine({
	name: 'deck instance',
	getTable: ns => [ns.guildId, 'deck_instances'],
});
module.exports.deckInstanceData = deckInstanceData;

/**
 * Creates a new deck instance.
 * @param {discord.Guild} guild The guild to create it in.
 * @param {discord.User} creator The creator.
 * @param {string} deckId The deck to spawn an instance of.
 * @param {"public" | "private"} visibility Who is allowed to draw from this instance.
 * @returns {DeckInstanceData}
 */
function createDeckInstance(guild, creator, deckId, visibility) {
	return {
		id: db.dbId(),
		guild: guilds.getGuildInfo(guild),
		deckId,
		creatorId: creator.id,
		visibility,
		drawnCardIds: [],
	};
}
module.exports.createDeckInstance = createDeckInstance;

/**
 * Builds the message content for a deck instance's "show" message.
 * @param {import("./deck").DeckData} deck The deck the instance was spawned from.
 * @param {DeckInstanceData} instance The deck instance.
 * @returns {{ embeds: discord.EmbedBuilder[], components: discord.ActionRowBuilder[] }}
 */
function formatDeckInstanceMessage(deck, instance) {
	const embed = new discord.EmbedBuilder()
		.setTitle(deck.name)
		.setDescription(deck.description)
		.setFooter({ text: instance.visibility === 'private' ? 'Private draw pile - only the creator can draw' : 'Public draw pile - anyone can draw' });

	const button = new discord.ButtonBuilder()
		.setCustomId(`draw-card/${instance.id}`)
		.setLabel('Draw a card')
		.setEmoji('🎴')
		.setStyle(discord.ButtonStyle.Primary);

	return {
		embeds: [embed],
		components: [new discord.ActionRowBuilder().addComponents(button)],
	};
}
module.exports.formatDeckInstanceMessage = formatDeckInstanceMessage;
