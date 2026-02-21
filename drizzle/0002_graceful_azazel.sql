CREATE TABLE `design_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`company` json NOT NULL,
	`platformTheme` json NOT NULL,
	`proposalDesign` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `design_settings_userId_unique` UNIQUE(`userId`)
);
