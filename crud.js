const db = require("./db");
const discord = require("discord.js");

/**
 * Settings to define a CRUD object.
 * @template T
 * @template N
 * @typedef {Object} CrudSettings
 * @property {string} name The name of this record.
 * @property {string?} displayNameSingular The display name in singular.
 * @property {string?} displayNamePlural The display name in plural.
 * @property {(namespace: N) => Table} getTable Gets the table name.
 * @property {(record: T) => string} getId Gets the ID.
 * @property {(record: T?) => T?} migrate Migrates a record.
 * @property {((record: T, template: () => discord.EmbedBuilder) => discord.EmbedBuilder)?} formatFull Formats the record as an embed.
 * @property {((record: T) => string)?} formatShort Formats the record as a single-line string.
 */

/**
 * @template T
 * @template N
 * @typedef {ReturnType<typeof crudDefine<T, N>>} Crud
 */

/**
 * @function
 * @template T
 * @template N
 * @param {CrudSettings<T, N>} crudSettings 
 */
function crudDefine(crudSettings) {
  if (!crudSettings.getTable) {
    throw new Error("Missing CRUD `getTable`.");
  }

  if (!crudSettings.name) {
    throw new Error("Missing CRUD `name`.");
  }

  if (!crudSettings.displayNameSingular) {
    crudSettings.displayNameSingular = crudSettings.name[0].toUpperCase() + crudSettings.name.slice(1);
  }

  if (!crudSettings.displayNamePlural) {
    crudSettings.displayNamePlural = crudSettings.displayNameSingular + "s";
  }

  if (!crudSettings.migrate) {
    crudSettings.migrate = record => record;
  }

  if (!crudSettings.getId) {
    crudSettings.getId = record => record.id;
  }

  if (!crudSettings.formatShort) {
    crudSettings.formatShort = record => `\`${crudSettings.getId(record)}\``;
  }

  const baseFmtFull = record => new discord.EmbedBuilder().setTitle(crudSettings.displayNameSingular).setDescription(crudSettings.formatShort(record)).setTimestamp(record.createdAt);

  if (!crudSettings.formatFull) {
    crudSettings.formatFull = baseFmtFull;
  }

  return {
    name: crudSettings.name,
    /**
     * Formats the display name for the given amount.
     * @param {number} n The number
     * @returns {string} The fitting display name.
     */
    displayName: (n = 0) => n > 1 ? crudSettings.displayNamePlural : `${n} ${crudSettings.displayNameSingular}`,
    displayNameSingular: crudSettings.displayNameSingular,
    displayNamePlural: crudSettings.displayNamePlural,
    /**
     * Builds a short string.
     * @param {T} record The record.
     * @returns {string} The string.
     */
    formatShort: record => crudSettings.formatShort(record),
    /**
     * Builds a full embed.
     * @param {T} record The record.
     * @returns {discord.EmbedBuilder} The embed.
     */
    formatFull: record => crudSettings.formatFull(record, () => baseFmtFull(record)),
    /**
     * Gets the ID of a record.
     * @param {T} record The record.
     * @returns {string} The ID.
     */
    getId: crudSettings.getId,
    /**
     * Registers the table for this CRUD namespace.
     * @param {N} namespace The namespace.
     */
    register: function (namespace) {
      const table = crudSettings.getTable(namespace);
      db.dbRegister(table);
    },
    /**
     * Gets a single record with the given ID.
     * @param {N} namespace The namespace.
     * @param {string} id The record ID.
     * @returns {T?} The record, if found.
     */
    get: function (namespace, id) {
      const table = crudSettings.getTable(namespace);
      const record = db.dbGet(table, id);
      return crudSettings.migrate(record);
    },
    /**
     * Gets all records.
     * @param {N} namespace The namespace.
     * @returns {T[]} The records.
     */
    getAll: function (namespace) {
      const table = crudSettings.getTable(namespace);
      const records = db.dbGetAll(table);
      return records.map(crudSettings.migrate);
    },
    /**
     * Updates/creates a record.
     * @param {N} namespace The namespace.
     * @param {T} record The record to write.
     * @returns The updated record.
     */
    write: function (namespace, record) {
      record = crudSettings.migrate(record);
      const table = crudSettings.getTable(namespace);
      const id = crudSettings.getId(record);
      db.dbWrite(table, id, record);
      return record;
    },
    /**
     * Deletes a record.
     * @param {N} namespace The namespace.
     * @param {T} record The record to write.
     */
    delete: function (namespace, record) {
      record = crudSettings.migrate(record);
      const table = crudSettings.getTable(namespace);
      const id = crudSettings.getId(record);
      db.dbDelete(table, id, record);
    },
  }
}
module.exports.crudDefine = crudDefine;

/**
 * Settings to define a CRUD update.
 * @template T
 * @template N
 * @typedef {Object} CrudCommandUpdateSettings
 * @property {string?} name The name of the command.
 * @property {string} description The command description.
 * @property {Crud<T, N>} crud The CRUD object.
 * @property {CrudCommandUpdateSettingsOption<T>[]} options The options.
 * @property {((builder: discord.SlashCommandBuilder) => void)?} factory An additional factory to further configure the command.
 * @property {(interaction: discord.ChatInputCommandInteraction) => T} getDefault Gets a default record.
 * @property {(interaction: discord.ChatInputCommandInteraction) => N} getNamespace Gets the namespace.
 * @property {boolean?} disableDelete No deleting.
 * @property {boolean?} disableUpdate No updating.
 */

/**
 * @template T
 * @typedef {Object} CrudCommandUpdateSettingsOption
 * @property {(builder: discord.SlashCommandBuilder) => void} factory
 * @property {(interaction: discord.ChatInputCommandInteraction) => any | { value?: any, errors?: string[] }} retriever
 * @property {(value: any, record: T) => void} updater
 * @property {boolean?} allowNullValues
 * @property {boolean?} allowRetrieverErrors
 */

/**
 * Defines a CRUD update command.
 * @function
 * @template T
 * @template N
 * @param {CrudCommandUpdateSettings<T, N>} crudSettings 
 */
function crudCommandUpdate(crudSettings) {
  if (!crudSettings.description) throw new Error("A command description is required");
  if (!crudSettings.crud) throw new Error("The CRUD object is required");

  if (!crudSettings.name) {
    crudSettings.name = crudSettings.crud.name;
  }

  const builder = new discord.SlashCommandBuilder()
    .setName(crudSettings.name)
    .setDescription(crudSettings.description)
    .setDefaultMemberPermissions(crudSettings.defaultMemberPermissions);

  if (!crudSettings.disableUpdate) {
    builder.addStringOption(option => {
      option.setName("id");
      option.setDescription(`Updates ${crudSettings.crud.displayNamePlural} instead of creating a new one.`);
      return option;
    });
  }
  if (!crudSettings.disableDelete) {
    builder.addBooleanOption(option => {
      option.setName("delete");
      option.setDescription(`If set, the ${crudSettings.crud.displayNamePlural} will be deleted.`);
      return option;
    });
  }

  for (const option of crudSettings.options) {
    option.factory(builder, option);
  }

  if (crudSettings.factory) {
    crudSettings.factory(builder, crudSettings);
  }

  /**
   * Executes the command.
   * @param {discord.ChatInputCommandInteraction} interaction The command interaction.
   */
  async function execute(interaction) {
    // Get fixed options
    const id = interaction.options.getString("id", false);
    const deleteFlag = interaction.options.getBoolean("delete", false);
    const namespace = crudSettings.getNamespace(interaction);
    const errors = [];

    // Get records to update.
    let operationName = '';
    const recordsToUpdate = [];
    if (id === null) {
      const defaultRecord = crudSettings.getDefault(interaction);
      const defaultRecordId = crudSettings.crud.getId(defaultRecord);
      // Ensure we arent overwriting records which have a generated ID
      const oldRecord = crudSettings.crud.get(namespace, defaultRecordId);
      if (oldRecord) {
        errors.push(`Cannot create new ${crudSettings.crud.displayNameSingular} with ID \`${defaultRecordId}\` since it already exists. *(${crudSettings.crud.formatShort(oldRecord)})*`);
      } else {
        recordsToUpdate.push(defaultRecord);
        operationName = 'created';
      }
    } else if (id === "all") {
      const allRecords = crudSettings.crud.getAll(namespace);
      recordsToUpdate.push(...allRecords);
    } else {
      const idParts = id.split(",").map(idPart => idPart.trim()).filter(idPart => idPart);
      for (const idPart of idParts) {
        const idRecord = crudSettings.crud.get(namespace, idPart);
        if (idRecord === null) {
          errors.push(`Could not find ${crudSettings.crud.displayNameSingular} with ID \`${idPart}\`.`);
        } else {
          recordsToUpdate.push(idRecord);
        }
      }
    }

    // We must at least update one record.
    if (recordsToUpdate.length === 0 && errors.length === 0) {
      errors.push(`No ${crudSettings.crud.displayNamePlural} found.`);
    }

    // Cannot continue with errors.
    if (errors.length > 0) {
      return interaction.reply({
        content: `# Errors are present\n${errors.map(str => `- ${str}`).join('\n')}`,
        ephemeral: true,
      });
    }

    // Delete records.
    if (deleteFlag) {
      operationName = 'deleted';
      for (const record of recordsToUpdate) {
        crudSettings.crud.delete(namespace, record);
      }
      return interaction.reply({
        // TODO: ISSUE: Could exceed message length
        content: `# ${crudSettings.crud.displayName(recordsToUpdate.length)} ${operationName}\n${recordsToUpdate.map(crudSettings.crud.formatShort).map(str => `- ${str}`).join('\n')}`,
      });
    }

    // Update/Create records.
    const optionsValueArray = [];
    for (let i = 0; i < crudSettings.options.length; i++) {
      const option = crudSettings.options[i];
      const retrieved = option.retriever(interaction);
      const retrievedErrors = option.allowRetrieverErrors ? retrieved.errors : null;
      const retrievedValue = option.allowRetrieverErrors ? retrieved.value : retrieved;
      optionsValueArray[i] = retrievedValue;
      if (retrievedErrors) {
        errors.push(...retrievedErrors);
      }
    }
    // Cannot continue with errors.
    if (errors.length > 0) {
      return interaction.reply({
        content: `# Errors are present\n${errors.map(str => `- ${str}`).join('\n')}`,
        ephemeral: true,
      });
    }
    // Perform patches.
    for (const record of recordsToUpdate) {
      for (let i = 0; i < crudSettings.options.length; i++) {
        const option = crudSettings.options[i];
        const value = optionsValueArray[i];
        if (value !== null || option.allowNullValues) {
          option.updater(value, record);
          if (!operationName) {
            operationName = 'updated';
          }
        }
      }
      crudSettings.crud.write(namespace, record);
    }

    if (!operationName) {
      operationName = 'displayed';
    }
    return interaction.reply({
      content: `# ${crudSettings.crud.displayName(recordsToUpdate.length)} ${operationName}`,
      embeds: recordsToUpdate.map(crudSettings.crud.formatFull)
    });
  }

  return {
    name: builder.name,
    data: builder,
    execute,
  };
}
module.exports.crudCommandUpdate = crudCommandUpdate;

const crudCommandOption = {
  /**
   * @function
   * @template T
   * @param {{ name: string, description: string, key?: keyof T }} crudSettings 
   * @returns {CrudCommandUpdateSettingsOption<T>}
   */
  simpleString: function (crudSettings) {
    if (!crudSettings.key) {
      crudSettings.key = crudSettings.name;
    }

    return {
      factory: builder => builder.addStringOption(option => option.setName(crudSettings.name).setDescription(crudSettings.description)),
      retriever: interaction => interaction.options.getString(crudSettings.name, false),
      updater: (value, record) => record[crudSettings.key] = value,
    };
  },
  /**
   * @function
   * @template T
   * @param {{ name: string, description: string, key?: keyof T }} crudSettings 
   * @returns {CrudCommandUpdateSettingsOption<T>}
   */
  simpleBoolean: function (crudSettings) {
    if (!crudSettings.key) {
      crudSettings.key = crudSettings.name;
    }
    return {
      factory: builder => builder.addBooleanOption(option => option.setName(crudSettings.name).setDescription(crudSettings.description)),
      retriever: interaction => interaction.options.getBoolean(crudSettings.name, false),
      updater: (value, record) => record[crudSettings.key] = value,
    };
  },
  /**
   * @function
   * @template T
   * @param {{ name: string, description: string, key?: keyof T }} crudSettings 
   * @returns {CrudCommandUpdateSettingsOption<T>}
   */
  simpleChannel: function (crudSettings) {
    const channels = require("./channel");

    if (!crudSettings.key) {
      crudSettings.key = crudSettings.name;
    }

    return {
      factory: builder => builder.addChannelOption(option => option.setName(crudSettings.name).setDescription(crudSettings.description)),
      retriever: interaction => interaction.options.getChannel(crudSettings.name, false),
      updater: (value, record) => record[crudSettings.key] = channels.getChannelInfo(value),
    };
  },
  /**
   * @function
   * @template T
   * @template F
   * @template N
   * @param {{ name: string, description: string, key?: keyof T, fkCrud: Crud<F, N>, getFkNamespace: (interaction: discord.ChatInputCommandInteraction) => N }} crudSettings 
   * @returns {CrudCommandUpdateSettingsOption<T>}
   */
  simpleFk: function (crudSettings) {
    if (!crudSettings.key) {
      crudSettings.key = crudSettings.name;
    }

    return {
      factory: builder => builder.addStringOption(option => option.setName(crudSettings.name).setDescription(crudSettings.description)),
      retriever: interaction => {
        const strValue = interaction.options.getString(crudSettings.name, false);
        if (strValue === null) {
          return { value: null };
        }
        const fkNamespace = crudSettings.getFkNamespace(interaction);
        const fkRecord = crudSettings.fkCrud.get(fkNamespace, strValue);
        if (fkRecord === null) {
          return { errors: [`\`${crudSettings.name}\`: Could not find ${crudSettings.fkCrud.displayNameSingular} with ID \`${strValue}\`.`] };
        }

        return { value: crudSettings.fkCrud.getId(fkRecord) };
      },
      updater: (value, record) => record[crudSettings.key] = value,
      allowRetrieverErrors: true,
    };
  }
}
module.exports.crudCommandOption = crudCommandOption;

