const discord = require("discord.js");
const crud = require("../../crud");
const { deckData } = require("../../logic/deck");
const { deckInstanceData, createDeckInstance, formatDeckInstanceMessage } = require("../../logic/deck-instance");

const deckOption = crud.crudCommandOption.simpleFk({
	name: "deck",
	description: "The deck to show.",
	fkCrud: deckData,
	getFkNamespace: interaction => ({ guildId: interaction.guildId }),
	required: true,
});

const builder = new discord.SlashCommandBuilder()
	.setName("show-deck")
	.setDescription("Shows a deck with a button to draw random cards from it.");
deckOption.factory(builder);
builder.addStringOption(option => option
	.setName("visibility")
	.setDescription("Who can draw from this deck instance. Defaults to public.")
	.addChoices(
		{ name: "Public - anyone can draw", value: "public" },
		{ name: "Private - only you can draw", value: "private" },
	));
builder.addBooleanOption(option => option
	.setName("compact-drawing")
	.setDescription("If enabled, each new draw/reshuffle message deletes the previous one. Defaults to off."));

/**
 * @param {discord.ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
	const retrieved = deckOption.retriever(interaction);
	if (retrieved.errors) {
		return interaction.reply({
			content: `# Errors are present\n${retrieved.errors.map(str => `- ${str}`).join('\n')}`,
			ephemeral: true,
		});
	}

	const namespace = { guildId: interaction.guildId };
	const deck = deckData.get(namespace, retrieved.value);
	const visibility = interaction.options.getString("visibility", false) ?? "public";
	const compactDrawing = interaction.options.getBoolean("compact-drawing", false) ?? false;

	const instance = createDeckInstance(interaction.guild, interaction.user, deckData.getId(deck), visibility, compactDrawing);
	deckInstanceData.write(namespace, instance);

	const message = formatDeckInstanceMessage(deck, instance);
	return interaction.reply(message);
}

module.exports = {
	name: builder.name,
	data: builder,
	execute,
	autocomplete: interaction => deckOption.autocomplete(interaction),
};
