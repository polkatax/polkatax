import { Client } from "pg";
import { newDb } from "pg-mem";

const db = newDb();
const client = db.adapters.createPgPromise();

const createDb = async () => {
  await client.none(`CREATE TABLE IF NOT EXISTS jobs (
        status TEXT,
        wallet TEXT,
        blockchain TEXT,
        last_modified TIMESTAMPTZ,
        deleted BOOLEAN,
        data JSONB,
        error JSONB,
        sync_from_date TIMESTAMPTZ,
        currency TEXT,
        synced_until TIMESTAMPTZ,
        req_id TEXT
        );`);
};

export const initInMemoryDb = async (): Promise<Client> => {
  await createDb();
  /**
   * notify does not work using pg-mem. Hence a wrapper is needed for local testing.
   */
  const clientWithNotify = {
    ...client,
    query: (queryString: string, values: any[]) => {
      queryString = queryString.trim();
      if (queryString.startsWith("NOTIFY")) {
        const parts = queryString.split(" ");
        const channel = parts[1].replace(";", "");
        let payload = queryString
          .replace("NOTIFY", "")
          .replace(channel, "")
          .trim();
        if (payload.endsWith(";")) {
          payload = payload.substring(0, payload.length - 1);
        }
        clientWithNotify.notificationSubscriptions.forEach((cb) => {
          cb({ channel, payload: payload || "{}" });
        });
      } else if (queryString.startsWith("LISTEN")) {
        // pass
      } else {
        return client.query(queryString, values);
      }
    },
    on: (_event: string, cb: any) => {
      clientWithNotify.notificationSubscriptions.push(cb);
      console.log(clientWithNotify.notificationSubscriptions);
    },
    notificationSubscriptions: [],
  };
  return clientWithNotify;
};
