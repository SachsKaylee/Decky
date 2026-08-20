const discord = require("discord.js");
const { deckData } = require("../../logic/deck");
const { cardData } = require("../../logic/card");
const { batchLines } = require("../../fmt");

const builder = new discord.SlashCommandBuilder()
	.setName("deck-overview")
	.setDescription("Lists all cards, grouped by deck.");

/**
 * @param {discord.ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
	const namespace = { guildId: interaction.guildId };
	const decks = deckData.getAll(namespace);

	if (decks.length === 0) {
		return interaction.reply({ content: `No ${deckData.displayNamePlural} found.`, ephemeral: true });
	}

	const cards = cardData.getAll(namespace);

	const lines = [];
	for (const deck of decks) {
		const deckId = deckData.getId(deck);
		lines.push(`# ${deckData.formatShort(deck)}`);
		const deckCards = cards.filter(card => card.deckId === deckId);
		if (deckCards.length === 0) {
			lines.push('- *No cards.*');
		} else {
			for (const card of deckCards) {
				lines.push(`- ${cardData.formatShort(card)}`);
			}
		}
		lines.push('');
	}

	const batches = batchLines(lines);
	await interaction.reply({ content: batches[0] });
	for (const batch of batches.slice(1)) {
		await interaction.followUp({ content: batch });
	}
}

module.exports = {
	name: builder.name,
	data: builder,
	execute,
};
