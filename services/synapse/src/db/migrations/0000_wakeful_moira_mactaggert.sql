CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`listener_id` text NOT NULL,
	`transaction_hash` text NOT NULL,
	`contract_address` text NOT NULL,
	`block_number` integer NOT NULL,
	`event_name` text NOT NULL,
	`event_data` text NOT NULL,
	`chain_id` text NOT NULL,
	`organization_id` text,
	`transaction_id` text,
	`created_at` integer,
	`updated_at` integer
);
