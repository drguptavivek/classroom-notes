CREATE TABLE `exercises` (
	`code` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`admin_hash` text NOT NULL,
	`open` integer DEFAULT 1 NOT NULL,
	`revealed` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
