const Knex = require("knex");
const tableNames = require("../../src/constants/tableNames");

const createDefaultColumns = table => {
  // adds created_at and updated_at column with datetime type and defaults to now
  table.timestamps(false, true);
  table.datetime("deleted_at");
};

const createNameIdTable = (knex, tableName) => {
  return knex.schema.createTable(tableName, table => {
    table.increments().notNullable();
    table
      .string("name")
      .notNullable()
      .unique();
    createDefaultColumns(table);
  });
};

const createReference = (table, referenceName) => {
  table
    .integer(`${referenceName}_id`)
    .unsigned()
    .references("id")
    .inTable(referenceName)
    .onDelete("cascade");
};

const createUrl = (table, columnName) => {
  table.string(columnName, 2000);
};

const createEmail = table => {
  return table.string("email", 254);
};

/**
 * @param {Knex} knex
 */
exports.up = async knex => {
  // create tables that don't have foreign key references
  await Promise.all([
    // specify table schema
    knex.schema.createTable(tableNames.user, table => {
      // auto incrementing id column
      table.increments().notNullable();
      createEmail(table)
        .notNullable()
        .unique();
      table.string("name").notNullable();
      table.string("password", 500).notNullable();
      table.datetime("last_login");
      createDefaultColumns(table);
    }),
    createNameIdTable(knex, tableNames.item_type),
    createNameIdTable(knex, tableNames.state),
    createNameIdTable(knex, tableNames.country),
    createNameIdTable(knex, tableNames.shape),
    knex.schema.createTable(tableNames.location, table => {
      // auto incrementing id column
      table.increments().notNullable();
      table
        .string("name")
        .notNullable()
        .unique();
      table.string("description", 1000);
      createUrl(table, "image_url");
      createDefaultColumns(table);
    })
  ]);

  await knex.schema.createTable(tableNames.address, table => {
    table.increments().notNullable();
    table.string("street_address_1", 50).notNullable();
    table.string("street_address_2", 50);
    table.string("city", 50).notNullable();
    table.string("zipcode", 15).notNullable();
    table.float("latitude").notNullable();
    table.float("longitude").notNullable();
    // foreign key reference
    createReference(table, "state");
    createReference(table, "country");
    createDefaultColumns(table);
  });
  await knex.schema.createTable(tableNames.manufacturer, table => {
    table.increments().notNullable();
    table.string("name").notNullable();
    table.string("description", 1000);
    table.string("type");
    createUrl(table, "logo_url");
    createUrl(table, "website_url");
    createEmail(table).notNullable();
    createReference(table, "address");
    createDefaultColumns(table);
  });
  await knex.schema.createTable(tableNames.size, table => {
    table.increments().notNullable();
    table.string("name").notNullable();
    table.float("length");
    table.float("width");
    table.float("height");
    createReference(table, "shape");
    table.float("volume");
    createDefaultColumns(table);
  });
  await knex.schema.createTable(tableNames.item, table => {
    table.increments().notNullable();
    createReference(table, "user");
    table.string("name").notNullable();
    table.string("description", 1000);
    createReference(table, "item_type");
    createReference(table, "manufacturer");
    createReference(table, "size");
    table.string("sku");
    createDefaultColumns(table);
  });

  await Promise.all([
    knex.schema.createTable(tableNames.item_info, table => {
      table.increments().notNullable();
      createReference(table, "user");
      table.datetime("purchase_date").notNullable();
      table.datetime("expiration_date");
      table.string("purchase_location");
      table.datetime("last_used");
      table.float("price");
      createDefaultColumns(table);
    }),
    knex.schema.createTable(tableNames.item_image, table => {
      table.increments().notNullable();
      createReference(table, "user");
      createUrl(table, "image_url");
      createDefaultColumns(table);
    }),
    knex.schema.createTable(tableNames.related_item, table => {
      table.increments().notNullable();
      createReference(table, "user");
      table
        .integer(`related_item_id`)
        .unsigned()
        .references("id")
        .inTable("item")
        .onDelete("cascade");
      createDefaultColumns(table);
    })
  ]);
};

exports.down = async knex => {
  await Promise.all(
    [
      tableName.related_item,
      tableName.item_image,
      tableName.item_info,
      tableNames.size,
      tableNames.manufacturer,
      tableNames.item,
      tableNames.address,
      // drop fk tables first
      tableNames.user,
      tableNames.item_type,
      tableNames.state,
      tableNames.country,
      tableNames.shape,
      tableNames.location
    ].map(tableName => knex.schema.dropTable(tableName))
  );
};
