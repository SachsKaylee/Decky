const crud = require("../../crud");
const { deckData, createDefaultDeck } = require("../../logic/deck");

module.exports = crud.crudCommandUpdate({
	description: 'Creates or updates a deck.',
	crud: deckData,
	getNamespace: interaction => ({ guildId: interaction.guildId }),
	getDefault: interaction => createDefaultDeck(interaction.guild, interaction.user),
	options: [
		crud.crudCommandOption.simpleString({
			name: "name",
			description: "The name of the deck.",
		}),
		crud.crudCommandOption.simpleString({
			name: "description",
			description: "The description of the deck.",
		}),
	],
});