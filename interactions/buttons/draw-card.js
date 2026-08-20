const discord = require("discord.js");
const { cardData } = require("../../logic/card");
const { deckInstanceData } = require("../../logic/deck-instance");

/**
 * @param {discord.ButtonInteraction} interaction
 */
async function execute(interaction) {
	const [, instanceId] = interaction.customId.split("/");
	const namespace = { guildId: interaction.guildId };

	const instance = deckInstanceData.get(namespace, instanceId);
	if (!instance) {
		return interaction.reply({ content: "This deck instance no longer exists.", ephemeral: true });
	}

	if (instance.visibility === "private" && instance.creatorId !== interaction.user.id) {
		return interaction.reply({ content: "Only the creator of this deck instance can draw from it.", ephemeral: true });
	}

	const cards = cardData.getAll(namespace).filter(card => card.deckId === instance.deckId);
	const remaining = cards.filter(card => !instance.drawnCardIds.includes(cardData.getId(card)));
	if (remaining.length === 0) {
		return interaction.reply({ content: "No cards are left to draw from this deck.", ephemeral: true });
	}

	const card = remaining[Math.floor(Math.random() * remaining.length)];
	instance.drawnCardIds.push(cardData.getId(card));
	deckInstanceData.write(namespace, instance);

	return interaction.reply({
		content: `${interaction.user} drew a card!`,
		embeds: [cardData.formatFull(card)],
		files: cardData.getAttachments(card),
	});
}

module.exports = {
	name: "draw-card",
	execute,
};
