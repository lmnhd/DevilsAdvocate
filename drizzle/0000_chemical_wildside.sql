CREATE TABLE `debates` (
	`id` text PRIMARY KEY NOT NULL,
	`claim` text NOT NULL,
	`believer_argument` text NOT NULL,
	`skeptic_argument` text NOT NULL,
	`judge_verdict` text NOT NULL,
	`confidence_score` integer NOT NULL,
	`evidence_sources` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`cache_key` text NOT NULL,
	`tool_type` text NOT NULL,
	`query` text NOT NULL,
	`result_data` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_cache_cache_key_unique` ON `evidence_cache` (`cache_key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`username` text NOT NULL,
	`preferences` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);