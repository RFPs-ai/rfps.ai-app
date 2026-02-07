import { pgTable, text, timestamp, boolean, integer, json, pgEnum, uuid, index, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userRfpStatusEnum = pgEnum("user_rfp_status", [
  "new",
  "reviewing",
  "assigned",
  "pursuing",
  "snoozed",
  "dismissed",
  "submitted",
]);
export const thumbsEnum = pgEnum("thumbs", ["up", "down"]);
export const dataSourceStatusEnum = pgEnum("data_source_status", [
  "active",
  "paused",
  "error",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_match",
  "deadline_warning",
  "system",
]);

// ================================
// Better Auth Required Tables
// ================================

// Users table (Better Auth compatible - exact column names)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  // Custom fields for RFPs.ai
  role: userRoleEnum("role").default("user"),
});

// Sessions table (Better Auth compatible)
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Accounts table (Better Auth OAuth - exact column names)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Verification table (Better Auth - for email verification, password reset, etc.)
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const aiUsageEvents = pgTable("ai_usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: text("user_id").notNull(),

  feature: text("feature").notNull(), 
  provider: text("provider").notNull(), 
  model: text("model").notNull(), 

  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),

  costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


// ================================
// RFPs.ai Application Tables
// ================================

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),

  // NAICS/UNSPSC codes
  naicsCodes: json("naics_codes").$type<string[]>().default([]),
  unspscCodes: json("unspsc_codes").$type<string[]>().default([]),

  // Certifications
  certifications: json("certifications").$type<string[]>().default([]),

  // Geographic preferences
  regions: json("regions").$type<string[]>().default([]),
  languages: json("languages").$type<string[]>().default([]),

  // Budget constraints
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),

  // Filters
  negativeKeywords: json("negative_keywords").$type<string[]>().default([]),
  buyerBlacklist: json("buyer_blacklist").$type<string[]>().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RFPs table
export const rfps = pgTable(
  "rfps",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Source information
    sourceId: text("source_id").notNull(), // Original ID from source
    source: text("source").notNull(), // e.g., "CanadaBuys", "Ontario Tenders"
    sourceUrl: text("source_url"),

    // Basic info
    title: text("title").notNull(),
    description: text("description"),
    buyerId: text("buyer_id"),
    buyerName: text("buyer_name"),
    solicitationNumber: text("solicitation_number"),

    // Classification
    naicsCode: text("naics_code"),
    unspscCode: text("unspsc_code"),

    // Location & language
    region: text("region"), // Province/state
    language: text("language"), // EN, FR, etc.

    // Budget
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    currency: text("currency").default("CAD"),

    // Eligibility
    setAside: text("set_aside"), // e.g., "Small Business", "Indigenous"
    requiredCertifications: json("required_certifications").$type<string[]>().default([]),

    // Deadlines
    deadlineQa: timestamp("deadline_qa"),
    deadlineIntent: timestamp("deadline_intent"),
    deadlineSubmission: timestamp("deadline_submission"),

    // Deduplication
    fingerprint: text("fingerprint").notNull().unique(),

    // Metadata
    publishedAt: timestamp("published_at"),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    fingerprintIdx: index("fingerprint_idx").on(table.fingerprint),
    sourceIdIdx: index("source_id_idx").on(table.sourceId, table.source),
    deadlineIdx: index("deadline_idx").on(table.deadlineSubmission),
  })
);

// User-RFP junction table
export const userRfps = pgTable(
  "user_rfps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rfpId: uuid("rfp_id")
      .notNull()
      .references(() => rfps.id, { onDelete: "cascade" }),

    // Status
    status: userRfpStatusEnum("status").default("new"),

    // Scoring
    relevanceScore: integer("relevance_score"), // 0-100
    eligibilityScore: integer("eligibility_score"), // 0-100

    // Explainability
    matchReasons: json("match_reasons").$type<string[]>().default([]),
    ineligibilityReasons: json("ineligibility_reasons").$type<string[]>().default([]),

    // Feedback
    thumbs: thumbsEnum("thumbs"),

    // Workflow
    assignedTo: text("assigned_to"),
    notes: text("notes"),
    snoozedUntil: timestamp("snoozed_until"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    rfpIdIdx: index("rfp_id_idx").on(table.rfpId),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Search history
export const searchHistory = pgTable("search_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  filters: json("filters").$type<Record<string, any>>(),
  resultCount: integer("result_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false),
    rfpId: uuid("rfp_id").references(() => rfps.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notification_user_id_idx").on(table.userId),
    readIdx: index("notification_read_idx").on(table.read),
  })
);

// Data sources (for crawler monitoring)
export const dataSources = pgTable("data_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  status: dataSourceStatusEnum("status").default("active"),
  lastCrawl: timestamp("last_crawl"),
  lastSuccess: timestamp("last_success"),
  errorCount: integer("error_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ================================
// Relations
// ================================

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  company: one(companies),
  userRfps: many(userRfps),
  searchHistory: many(searchHistory),
  notifications: many(notifications),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const companiesRelations = relations(companies, ({ one }) => ({
  user: one(user, {
    fields: [companies.userId],
    references: [user.id],
  }),
}));

export const rfpsRelations = relations(rfps, ({ many }) => ({
  userRfps: many(userRfps),
  notifications: many(notifications),
}));

export const userRfpsRelations = relations(userRfps, ({ one }) => ({
  user: one(user, {
    fields: [userRfps.userId],
    references: [user.id],
  }),
  rfp: one(rfps, {
    fields: [userRfps.rfpId],
    references: [rfps.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(user, {
    fields: [searchHistory.userId],
    references: [user.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
  rfp: one(rfps, {
    fields: [notifications.rfpId],
    references: [rfps.id],
  }),
}));

// ================================
// Export Types
// ================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Rfp = typeof rfps.$inferSelect;
export type NewRfp = typeof rfps.$inferInsert;
export type UserRfp = typeof userRfps.$inferSelect;
export type NewUserRfp = typeof userRfps.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
