const crud = require("../../crud");
const { cardData, createDefaultCard } = require("../../logic/card");
const { deckData } = require("../../logic/deck");

module.exports = crud.crudCommandUpdate({
	description: 'Creates or updates a card.',
	crud: cardData,
	getNamespace: interaction => ({ guildId: interaction.guildId }),
	getDefault: interaction => createDefaultCard(interaction.guild, interaction.user),
	options: [
		crud.crudCommandOption.simpleString({
			name: "name",
			description: "The name of the card.",
		}),
		crud.crudCommandOption.simpleString({
			name: "description",
			description: "The description of the card.",
		}),
		crud.crudCommandOption.simpleFk({
			name: "deck",
			description: "The deck this card belongs to.",
			key: "deckId",
			fkCrud: deckData,
			getFkNamespace: interaction => ({ guildId: interaction.guildId }),
		}),
	],
});
