const discord = require("discord.js");
const { deckInstanceData, replyAndTrackInstanceMessage, buildInstanceButtons } = require("../../logic/deck-instance");

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
		return interaction.reply({ content: "Only the creator of this deck instance can reshuffle it.", ephemeral: true });
	}

	if (instance.drawnCardIds.length === 0) {
		return interaction.reply({ content: "No cards have been drawn yet.", ephemeral: true });
	}

	const drawnCount = instance.drawnCardIds.length;
	instance.drawnCardIds = [];

	return replyAndTrackInstanceMessage(interaction, namespace, instance, {
		content: `🔀 ${interaction.user} reshuffled the deck! ${drawnCount} card${drawnCount !== 1 ? 's' : ''} are back in the pile.`,
		components: buildInstanceButtons(instance),
	});
}

module.exports = {
	name: "reshuffle-deck",
	execute,
};
