CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`period` enum('daily','weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
	`spent` int NOT NULL DEFAULT 0,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('active','completed','exceeded') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`budgetId` int,
	`category` varchar(100) NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gamblingHabits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyLimit` int NOT NULL,
	`weeklyLimit` int NOT NULL,
	`monthlyLimit` int NOT NULL,
	`todaySpent` int NOT NULL DEFAULT 0,
	`thisWeekSpent` int NOT NULL DEFAULT 0,
	`thisMonthSpent` int NOT NULL DEFAULT 0,
	`enableAlerts` boolean NOT NULL DEFAULT true,
	`alertThreshold` int NOT NULL DEFAULT 80,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gamblingHabits_id` PRIMARY KEY(`id`)
);
