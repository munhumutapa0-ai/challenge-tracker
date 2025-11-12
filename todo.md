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
- [x] Create checkpoint for deployment

## PWA & Branding Updates
- [x] Change app name to "Challenge Tracker" (user needs to update in Settings UI)
- [x] Generate app logo
- [x] Create PWA manifest file
- [x] Implement service worker for offline functionality
- [x] Add install prompt for PWA
- [x] Optimize mobile responsiveness
- [x] Update favicon with new logo (user needs to update in Settings UI)
- [x] Push to GitHub
- [x] Publish application (ready for user to click Publish button)

## Custom Odds Feature
- [x] Update bets table to store odds per bet
- [x] Update AddBetDialog to accept custom odds input (max 1.3)
- [x] Update profit calculation to use custom odds per bet
- [x] Display custom odds in bet history
- [x] Update ChallengeDetail to show odds for each bet
- [x] Test custom odds calculations

## Flexible Strategy & Days Calculator
- [x] Add reinvestment strategy column to challenges table (compound vs take-profit)
- [x] Update CreateChallengeDialog with strategy selection
- [x] Create DaysCalculator component for estimating days needed
- [x] Update profit calculation based on selected strategy
- [x] Update ChallengeDetail to show strategy info
- [x] Update next stake calculation for take-profit strategy
- [x] Test both strategies with different odds

## Odds Validation
- [x] Add odds validation in AddBetDialog (max = challenge odds)
- [x] Add backend validation for odds limit
- [x] Display max odds hint in AddBetDialog
- [x] Show error if user exceeds challenge odds limit

## Challenge Management
- [x] Add edit challenge button to ChallengeDetail
- [x] Add delete challenge button to ChallengeDetail
- [x] Create EditChallengeDialog component
- [x] Verify odds input is visible in AddBetDialog
- [x] Test edit and delete functionality

## Design & UI Beautification
- [x] Update CSS theme to dark mode with green accents (22software style)
- [x] Add logout button to header
- [x] Beautify cards and components with new design
- [x] Update button styles with green theme
- [x] Fix publish/deployment changes visibility
- [x] Test all pages with new design

## Deployment & Caching Fix
- [ ] Clear browser cache and rebuild
- [ ] Verify published app shows latest changes
- [ ] Check service worker cache clearing

## Financial Tracking Features
- [ ] Add budget table to database schema
- [ ] Create budget management procedures (CRUD)
- [ ] Create Budget page with budget creation/editing
- [ ] Create Money Usage page to track spending
- [ ] Create Gambling Habits page with control tools
- [ ] Add responsible gambling tips and warnings
- [ ] Integrate budget with challenge tracking
- [ ] Add spending limits and alerts

## PDF Export & Analytics
- [x] Create Analytics Dashboard page
- [x] Add profit/loss calculations for dashboard
- [x] Add win rate and ROI metrics
- [x] Create PDF export for challenges
- [x] Create PDF export for expenses
- [x] Add export buttons to pages
- [x] Test PDF generation

## Mobile Navigation & UI Polish
- [x] Create mobile drawer navigation component
- [x] Hide horizontal nav on mobile, show drawer menu
- [x] Improve text alignment and spacing
- [x] Professional typography hierarchy
- [x] Responsive padding and margins
- [x] Test mobile layout
- [x] Add 10,000 monthly limit to Gambling Habits page

## Navigation Headers
- [ ] Add back/home button to Budget page
- [ ] Add back/home button to MoneyUsage page
- [ ] Add back/home button to GamblingHabits page
- [ ] Add back/home button to Analytics page
- [ ] Add back/home button to ChallengeDetail page
