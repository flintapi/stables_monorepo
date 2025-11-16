CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'off-ramp' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`network` text DEFAULT 'base' NOT NULL,
	`reference` text NOT NULL,
	`tracking_id` text,
	`wallet_id` text,
	`amount` real NOT NULL,
	`narration` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallet` (
	`id` text PRIMARY KEY NOT NULL,
	`network` text NOT NULL,
	`key_label` text NOT NULL,
	`primary_address` text,
	`addresses` text NOT NULL,
	`is_active` integer NOT NULL,
	`auto_sweep` integer NOT NULL,
	`auto_swap` integer NOT NULL,
	`has_virtual_account` integer NOT NULL,
	`swap_delta` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_key_label_unique` ON `wallet` (`key_label`);--> statement-breakpoint
CREATE INDEX `id_index` ON `wallet` (`id`);--> statement-breakpoint
CREATE INDEX `network_index` ON `wallet` (`network`);--> statement-breakpoint
CREATE UNIQUE INDEX `key_label_index` ON `wallet` (`key_label`);