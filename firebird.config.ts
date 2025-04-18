import "dotenv/config";
import { Options } from "node-firebird";

const options: Options = {
  host: process.env.FIREBIRD_DB_HOST,
  port: parseInt(process.env.FIREBIRD_DB_PORT, 10),
  database: process.env.FIREBIRD_DB_NAME,
  user: process.env.FIREBIRD_DB_USER,
  password: process.env.FIREBIRD_DB_PASSWORD,
  role: process.env.FIREBIRD_DB_ROLE,
  lowercase_keys: true,
  pageSize: 4096,
  retryConnectionInterval: 1000,
  blobAsText: false,
  encoding: "UTF8",
};

export default options;
