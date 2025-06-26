import { Client } from "pg";

export const initPostgresDbClient = async (): Promise<Client> => {
  const client = new Client({
    user: "polkadot",
    host: "localhost",
    database: "fe_polkadot",
    password: process.env["DB_PASSWORD"],
    port: 5432,
  });
  await client.connect();
  return client;
};
