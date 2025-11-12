CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`teamName` varchar(255) NOT NULL,
	`matchDetails` text,
	`stakeAmount` int NOT NULL,
	`result` enum('pending','win','loss') NOT NULL DEFAULT 'pending',
	`profit` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`initialStake` int NOT NULL,
	`targetAmount` int NOT NULL,
	`odds` int NOT NULL,
	`daysTotal` int NOT NULL,
	`status` enum('active','completed','failed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
