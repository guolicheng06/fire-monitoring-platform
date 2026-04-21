import { relations } from "drizzle-orm/relations";
import { customers, devices, alarmRecords, maintenanceRecords, users, userRoles, roles } from "./schema";

export const devicesRelations = relations(devices, ({one, many}) => ({
	customer: one(customers, {
		fields: [devices.customerId],
		references: [customers.id]
	}),
	alarmRecords: many(alarmRecords),
	maintenanceRecords: many(maintenanceRecords),
}));

export const customersRelations = relations(customers, ({many}) => ({
	devices: many(devices),
	alarmRecords: many(alarmRecords),
	userRoles: many(userRoles),
}));

export const alarmRecordsRelations = relations(alarmRecords, ({one}) => ({
	device: one(devices, {
		fields: [alarmRecords.deviceId],
		references: [devices.id]
	}),
	customer: one(customers, {
		fields: [alarmRecords.customerId],
		references: [customers.id]
	}),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({one}) => ({
	device: one(devices, {
		fields: [maintenanceRecords.deviceId],
		references: [devices.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
	customer: one(customers, {
		fields: [userRoles.customerId],
		references: [customers.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	userRoles: many(userRoles),
}));