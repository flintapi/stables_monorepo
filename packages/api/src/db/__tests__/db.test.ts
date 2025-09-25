import { describe, expect, it } from "vitest";

import { migrateDatabase, tursoApi } from "../index";

describe("db Suite", () => {
  it.skip("should create local .db file in .local_dbs/ folder", async () => {
    const dbName = `tenant-db-${Date.now()}`;

    const turso = tursoApi();
    const url = await turso.databases.create(dbName) as string;

    // TODO: Run migration against the database after creation

    console.log("Generated url of database", url);

    await migrateDatabase(url);
    expect(url).includes("file");
  });

  it("should migrate schema changes to db", async () => {
    const url = "file:./.local_dbs/tenant-db-1758501227976.db";

    await migrateDatabase(url);
  });

  it.only("should generate unique id", async () => {
    const generateUniqueId = (prefix: string) => {
      const random = crypto.randomUUID().replace(/-/g, "").substring(prefix.length);

      return `${prefix}${random}`;
    };
    const id = generateUniqueId("user_");

    console.log(id, "generated Id")
    expect(id).toMatch(/^user_[a-z0-9]/);
  })
});
