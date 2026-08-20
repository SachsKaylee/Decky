const path = require("path");
const discord = require("discord.js");
const crud = require("../crud");
const guilds = require("../guild");
const db = require("../db");
const { deckData } = require("./deck");

/**
 * card data.
 * @typedef {Object} CardData
 * @property {string} id The ID.
 * @property {guilds.GuildInfo} guild The guild.
 * @property {string} deckId The deck the card belongs to.
 * @property {string} name The card name.
 * @property {string} description The card description.
 * @property {string?} filePath The local file path the image is stored under.
 */

/**
 * @type {crud.Crud<CardData, { guildId: string }>}
 */
const cardData = crud.crudDefine({
	name: 'card',
	getTable: ns => [ns.guildId, 'cards'],
	formatShort: record => `\`${record.id}\` - ${record.name}`,
	formatFull: (record, template) => {
		const embed = template().setTitle(record.name).setDescription(record.description).setFooter({ text: record.id });
		if (record.filePath) {
			embed.setImage(`attachment://${path.basename(record.filePath)}`);
		}
		return embed;
	},
	getAttachments: record => record.filePath ? [new discord.AttachmentBuilder(record.filePath, { name: path.basename(record.filePath) })] : [],
});
module.exports.cardData = cardData;

/**
 * Creates a default card, assigned to the first available deck in the guild.
 * @param {discord.Guild} guild The guild to create it in.
 * @param {discord.User} creator The creator.
 * @returns {CardData}
 */
function createDefaultCard(guild, creator) {
	const decks = deckData.getAll({ guildId: guild.id });
	if (decks.length === 0) {
		throw new Error("Cannot create a card without a deck. Create a deck first.");
	}
	return {
		id: db.dbId(),
		name: `${creator.displayName}'s card`,
		description: `A card in ${guild.name}.`,
		deckId: deckData.getId(decks[0]),
		guild: guilds.getGuildInfo(guild),
	};
}
module.exports.createDefaultCard = createDefaultCard;
