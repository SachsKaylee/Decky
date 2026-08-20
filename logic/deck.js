const discord = require("discord.js");
const crud = require("../crud");
const guilds = require("../guild");
const db = require("../db");

/**
 * Deck data.
 * @typedef {Object} DeckData
 * @property {string} id The ID.
 * @property {guilds.GuildInfo} guild The guild.
 * @property {string} name The deck name.
 * @property {string} description The deck description.
 */

/**
 * @type {crud.Crud<DeckData, { guildId: string }>}
 */
const deckData = crud.crudDefine({
	name: 'deck',
	getTable: ns => [ns.guildId, 'decks'],
	formatShort: record => `\`${record.id}\` - ${record.name}`,
	formatFull: (record, template) => template().addFields({ name: record.name, value: record.description }),
});
module.exports.deckData = deckData;

/**
 * 
 * @param {discord.Guild} guild The guild to create it in.
 * @param {discord.User} creator The creator.
 * @returns {DeckData}
 */
function createDefaultDeck(guild, creator) {
	return {
		id: db.dbId(),
		name: `${creator.displayName}'s deck`,
		description: `A deck in ${guild.name}.`,
		guild: guilds.getGuildInfo(guild),
	};
}
module.exports.createDefaultDeck = createDefaultDeck;
