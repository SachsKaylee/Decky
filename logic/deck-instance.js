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
 * @property {boolean} compactDrawing If enabled, the previous draw/reshuffle message is deleted each time a new one is sent.
 * @property {string?} lastMessageId The ID of the last draw/reshuffle message sent for this instance.
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
 * @param {boolean} compactDrawing If enabled, the previous draw/reshuffle message is deleted each time a new one is sent.
 * @returns {DeckInstanceData}
 */
function createDeckInstance(guild, creator, deckId, visibility, compactDrawing) {
	return {
		id: db.dbId(),
		guild: guilds.getGuildInfo(guild),
		deckId,
		creatorId: creator.id,
		visibility,
		drawnCardIds: [],
		compactDrawing,
		lastMessageId: null,
	};
}
module.exports.createDeckInstance = createDeckInstance;

/**
 * Replies to a draw/reshuffle button interaction and persists the instance's new state.
 * If `compactDrawing` is enabled, the previously tracked message (from the last draw or
 * reshuffle) is deleted once the new one is sent, keeping only the latest visible.
 * @param {discord.ButtonInteraction} interaction The interaction to reply to.
 * @param {{ guildId: string }} namespace The namespace to persist the instance under.
 * @param {DeckInstanceData} instance The instance, with its new state already applied (not yet written).
 * @param {discord.BaseMessageOptions} replyOptions The reply content.
 */
async function replyAndTrackInstanceMessage(interaction, namespace, instance, replyOptions) {
	const response = await interaction.reply({ ...replyOptions, withResponse: true });
	const newMessageId = response.resource?.message?.id ?? null;

	if (instance.compactDrawing && instance.lastMessageId && instance.lastMessageId !== newMessageId) {
		await interaction.channel?.messages.delete(instance.lastMessageId).catch(() => { });
	}

	instance.lastMessageId = newMessageId;
	deckInstanceData.write(namespace, instance);
}
module.exports.replyAndTrackInstanceMessage = replyAndTrackInstanceMessage;

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

	const drawButton = new discord.ButtonBuilder()
		.setCustomId(`draw-card/${instance.id}`)
		.setLabel('Draw a card')
		.setEmoji('🎴')
		.setStyle(discord.ButtonStyle.Primary);

	const reshuffleButton = new discord.ButtonBuilder()
		.setCustomId(`reshuffle-deck/${instance.id}`)
		.setLabel('Reshuffle')
		.setEmoji('🔀')
		.setStyle(discord.ButtonStyle.Secondary);

	return {
		embeds: [embed],
		components: [new discord.ActionRowBuilder().addComponents(drawButton, reshuffleButton)],
	};
}
module.exports.formatDeckInstanceMessage = formatDeckInstanceMessage;
