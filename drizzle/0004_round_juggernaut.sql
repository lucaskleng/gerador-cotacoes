CREATE TABLE `proposal_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`quotationType` enum('products','services') NOT NULL DEFAULT 'products',
	`isDefault` int NOT NULL DEFAULT 0,
	`validityDays` int NOT NULL DEFAULT 30,
	`conditions` json NOT NULL,
	`texts` json NOT NULL,
	`defaultItems` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposal_templates_id` PRIMARY KEY(`id`)
);
