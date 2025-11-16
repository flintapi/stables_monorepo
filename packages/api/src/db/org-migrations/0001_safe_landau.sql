CREATE INDEX `virtual_account_idx` ON `transactions` (json_extract(`metadata`, '$.accountNumber'));--> statement-breakpoint
CREATE INDEX `address_idx` ON `transactions` (json_extract(`metadata`, '$.address'));
