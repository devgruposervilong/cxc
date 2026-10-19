CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `client` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`rif` text NOT NULL,
	`seller` text NOT NULL,
	`businessUnit` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_code_unique` ON `client` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `client_name_unique` ON `client` (`name`);--> statement-breakpoint
CREATE TABLE `document` (
	`id` text PRIMARY KEY NOT NULL,
	`uploadId` text NOT NULL,
	`rank` integer NOT NULL,
	`client` text NOT NULL,
	`rif` text,
	`type` text NOT NULL,
	`number` text NOT NULL,
	`emission` text,
	`expiration` text,
	`total` real,
	`seller` text,
	FOREIGN KEY (`uploadId`) REFERENCES `upload`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `document_upload_idx` ON `document` (`uploadId`);--> statement-breakpoint
CREATE TABLE `invite` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`tokenHash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`sellerId` text,
	`expiresAt` integer NOT NULL,
	`acceptedAt` integer,
	`createdBy` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`sellerId`) REFERENCES `seller`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_tokenHash_unique` ON `invite` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `invite_email_idx` ON `invite` (`email`);--> statement-breakpoint
CREATE TABLE `seller` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`surname` text,
	`zone` text,
	`keyUrl` text NOT NULL,
	`status` text DEFAULT 'ACTIVO' NOT NULL,
	`userId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seller_code_unique` ON `seller` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `seller_keyUrl_unique` ON `seller` (`keyUrl`);--> statement-breakpoint
CREATE UNIQUE INDEX `seller_userId_unique` ON `seller` (`userId`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`impersonatedBy` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `upload` (
	`id` text PRIMARY KEY NOT NULL,
	`fileName` text NOT NULL,
	`loadedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`banReason` text,
	`banExpires` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
