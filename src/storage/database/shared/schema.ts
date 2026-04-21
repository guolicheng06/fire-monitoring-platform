import { pgTable, index, pgPolicy, varchar, boolean, jsonb, timestamp, serial, foreignKey, unique, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const customers = pgTable("customers", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 500 }),
	contactPerson: varchar("contact_person", { length: 100 }),
	contactPhone: varchar("contact_phone", { length: 20 }),
	district: varchar({ length: 50 }),
	riskLevel: varchar("risk_level", { length: 20 }).default('medium'),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("customers_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("customers_district_idx").using("btree", table.district.asc().nullsLast().op("text_ops")),
	index("customers_risk_level_idx").using("btree", table.riskLevel.asc().nullsLast().op("text_ops")),
	pgPolicy("customers_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("customers_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("customers_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("customers_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const devices = pgTable("devices", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	deviceCode: varchar("device_code", { length: 100 }).notNull(),
	deviceType: varchar("device_type", { length: 50 }).notNull(),
	deviceName: varchar("device_name", { length: 255 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	location: varchar({ length: 255 }),
	installDate: timestamp("install_date", { withTimezone: true, mode: 'string' }),
	lastMaintenanceDate: timestamp("last_maintenance_date", { withTimezone: true, mode: 'string' }),
	status: varchar({ length: 20 }).default('online').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("devices_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("devices_device_code_idx").using("btree", table.deviceCode.asc().nullsLast().op("text_ops")),
	index("devices_device_type_idx").using("btree", table.deviceType.asc().nullsLast().op("text_ops")),
	index("devices_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "devices_customer_id_customers_id_fk"
		}),
	unique("devices_device_code_unique").on(table.deviceCode),
	pgPolicy("devices_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("devices_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("devices_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("devices_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const alarmRecords = pgTable("alarm_records", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	deviceId: varchar("device_id", { length: 36 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	alarmType: varchar("alarm_type", { length: 50 }).notNull(),
	alarmLevel: varchar("alarm_level", { length: 20 }).notNull(),
	alarmMessage: text("alarm_message"),
	alarmValue: varchar("alarm_value", { length: 100 }),
	location: varchar({ length: 255 }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	acknowledgedBy: varchar("acknowledged_by", { length: 100 }),
	acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
	resolvedBy: varchar("resolved_by", { length: 100 }),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	resolution: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("alarm_records_alarm_level_idx").using("btree", table.alarmLevel.asc().nullsLast().op("text_ops")),
	index("alarm_records_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("alarm_records_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("alarm_records_device_id_idx").using("btree", table.deviceId.asc().nullsLast().op("text_ops")),
	index("alarm_records_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.id],
			name: "alarm_records_device_id_devices_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "alarm_records_customer_id_customers_id_fk"
		}),
	pgPolicy("alarm_records_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("alarm_records_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("alarm_records_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("alarm_records_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const maintenanceRecords = pgTable("maintenance_records", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	deviceId: varchar("device_id", { length: 36 }).notNull(),
	maintenanceType: varchar("maintenance_type", { length: 50 }).notNull(),
	description: text(),
	technician: varchar({ length: 100 }),
	result: varchar({ length: 50 }).default('completed'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("maintenance_records_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("maintenance_records_device_id_idx").using("btree", table.deviceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.id],
			name: "maintenance_records_device_id_devices_id_fk"
		}),
	pgPolicy("maintenance_records_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("maintenance_records_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("maintenance_records_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("maintenance_records_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const userRoles = pgTable("user_roles", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	roleId: varchar("role_id", { length: 36 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_roles_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("user_roles_role_id_idx").using("btree", table.roleId.asc().nullsLast().op("text_ops")),
	index("user_roles_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "user_roles_customer_id_customers_id_fk"
		}),
	pgPolicy("user_roles_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("user_roles_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("user_roles_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("user_roles_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const roles = pgTable("roles", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	roleCode: varchar("role_code", { length: 50 }).notNull(),
	roleName: varchar("role_name", { length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	permissions: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("roles_role_code_idx").using("btree", table.roleCode.asc().nullsLast().op("text_ops")),
	unique("roles_role_code_unique").on(table.roleCode),
	pgPolicy("roles_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("roles_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("roles_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("roles_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`(gen_random_uuid())`).primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	realName: varchar("real_name", { length: 100 }),
	phone: varchar({ length: 20 }),
	avatar: varchar({ length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("users_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
	pgPolicy("users_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("users_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("users_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("users_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);
