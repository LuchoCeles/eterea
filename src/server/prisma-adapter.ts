import { PrismaMariaDb } from "@prisma/adapter-mariadb";

type MariaDbOptions = ConstructorParameters<typeof PrismaMariaDb>[0];

export function createMariaDbAdapter() {
  const connection = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  const database = connection?.pathname.replace(/^\//, "");
  const options: MariaDbOptions = {
    host: connection?.hostname ?? "127.0.0.1",
    port: Number(connection?.port || "4000"),
    user: connection ? decodeURIComponent(connection.username) : "root",
    password: connection ? decodeURIComponent(connection.password) : "",
    database: database ? decodeURIComponent(database) : "eterea",
    connectionLimit: 5,
    acquireTimeout: 4_000,
    connectTimeout: 4_000,
    ssl: Boolean(connection && !["localhost", "127.0.0.1"].includes(connection.hostname)),
  };
  return new PrismaMariaDb(options);
}
