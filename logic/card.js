const crud = require("../crud");

/**
 * card data.
 * @typedef {Object} CardData
 * @property {string} id The ID.
 * @property {guilds.GuildInfo} guild The guild.
 * @property {string} deckId The deck the card belongs to.
 * @property {string} name The card name.
 * @property {string} description The card description.
 * @property {string} filePath The local file path the image is stored under.
 */

/**
 * @type {crud.Crud<CardData, { guildId: string }>}
 */
const cardData = crud.crudDefine({
	name: 'card',
	getTable: ns => [ns.guildId, 'cards'],
	formatShort: record => `\`${record.id}\` - ${record.name}`,
	formatFull: (record, template) => template().addFields({ name: record.name, value: record.description }),
});
module.exports.cardData = cardData;
