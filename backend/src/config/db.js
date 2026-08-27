const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool(config.db);

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
