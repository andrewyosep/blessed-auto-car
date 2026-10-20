import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(), data: text("data").notNull(), updatedAt: integer("updated_at").notNull(),
});
export const showroom = sqliteTable("showroom", {
  id: text("id").primaryKey(), data: text("data").notNull(),
});
