# Betting Challenge Tracker - TODO

## Database Schema
- [x] Create challenges table (user_id, initial_stake, target_amount, odds, days_total, status)
- [x] Create bets table (challenge_id, day_number, team_name, match_details, stake_amount, result, profit, created_at)

## Backend Features
- [x] Create challenge procedure (start new betting challenge)
- [x] List challenges procedure (get user's challenges)
- [x] Get challenge details procedure (with all bets)
- [x] Add bet procedure (record daily bet)
- [x] Update bet result procedure (mark win/loss and calculate profit)
- [x] Delete challenge procedure

## Frontend Features
- [x] Challenge creation form (initial stake, target amount, number of days)
- [x] Active challenges dashboard
- [x] Challenge detail view with daily bet tracker
- [x] Add bet form (team name, match details)
- [x] Mark bet as win/loss with automatic profit calculation
- [x] Visual progress bar showing current amount vs target
- [x] Compound betting calculator display
- [x] Challenge history view

## Reminders
- [x] Set up daily 8 AM reminder for active challenges

## Testing & Deployment
- [x] Test complete betting flow
- [x] Test compound calculation accuracy
- [ ] Create checkpoint for deployment
