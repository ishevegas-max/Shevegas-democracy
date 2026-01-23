# Automation Setup Guide

## What This Does

**Automatic agenda monitoring** that:

- Checks municode site every 6 hours for new Common Council agendas
- Extracts votable items automatically
- Generates ballot HTML ready for your review
- Sends you email notification when new agenda found
- Creates draft ballot you can review and publish

**Your time:** 10-15 minutes per week (just review + record audio)
**Automation time:** Everything else

-----

## Setup Steps (One-Time, 10 Minutes)

### Step 1: Enable GitHub Actions

1. Go to your repo: https://github.com/SheVegas/shevegas-democracy
1. Click **Settings** tab
1. Click **Actions** → **General** (left sidebar)
1. Under “Actions permissions”:
- Select **“Allow all actions and reusable workflows”**
1. Click **Save**

### Step 2: Set Up Email Notifications

**You need a Gmail app password** (not your regular password):

1. Go to: https://myaccount.google.com/apppasswords
1. Log in with your Gmail (ishevegas@gmail.com)
1. Click **“Select app”** → **“Other (custom name)”**
1. Type: **“SheVegas Democracy Bot”**
1. Click **Generate**
1. **Copy the 16-character password** (you’ll need it in Step 3)

### Step 3: Add Secrets to GitHub

1. Go to your repo: https://github.com/SheVegas/shevegas-democracy
1. Click **Settings** → **Secrets and variables** → **Actions**
1. Click **“New repository secret”** (green button)
1. Add these THREE secrets:

**Secret 1:**

- Name: `EMAIL_USERNAME`
- Value: `ishevegas@gmail.com`
- Click “Add secret”

**Secret 2:**

- Name: `EMAIL_PASSWORD`
- Value: [paste the 16-character app password from Step 2]
- Click “Add secret”

**Secret 3:**

- Name: `NOTIFICATION_EMAIL`
- Value: `ishevegas@gmail.com` (where you want notifications sent)
- Click “Add secret”

### Step 4: Upload Automation Files

1. Download the 4 automation files:
- `automation/scraper.py`
- `automation/ballot-generator.py`
- `automation/requirements.txt`
- `.github/workflows/check-agenda.yml`
1. Go to GitHub repo
1. Create `automation` folder (if not exists):
- Click “Add file” → “Create new file”
- Type: `automation/README.md`
- Add any text
- Commit
1. Upload files:
- Go into `automation` folder
- Click “Add file” → “Upload files”
- Upload `scraper.py`, `ballot-generator.py`, `requirements.txt`
- Commit
1. Upload workflow:
- Go back to repo root
- Click “Add file” → “Create new file”
- Type: `.github/workflows/check-agenda.yml`
- Paste the workflow content
- Commit

### Step 5: Test the Automation

1. Go to **Actions** tab in GitHub
1. Click **“Check for New Council Agendas”** workflow
1. Click **“Run workflow”** button (right side)
1. Click green **“Run workflow”**
1. Wait 1-2 minutes
1. Check if it runs successfully

**If it finds an agenda:**

- You’ll get an email notification
- Files will be generated in `automation/` folder
- Pull request will be created (optional)

**If no agenda found:**

- Normal - just means no new meetings yet
- Will check again in 6 hours automatically

-----

## How It Works (Weekly Cycle)

### Automated Part (No Work From You):

**Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC):**

1. Scraper checks municode site
1. If new Common Council agenda found:
- Downloads and parses it
- Extracts votable items
- Generates ballot HTML
- **Sends you email: “New agenda ready!”**

### Your Part (10-15 minutes):

**When you get the email:**

1. Open GitHub repo
1. Go to `automation/generated_ballot.html`
1. Review auto-generated ballot items
1. Record audio explanations (2-5 min each item)
1. Save audio as MP3s
1. Copy ballot HTML into `index.html`
1. Upload audio files to `/audio/` folder
1. Commit and push
1. **Site auto-deploys in 30 seconds**

-----

## File Locations

**Generated files (after agenda found):**

- `automation/agenda_data.json` - Raw extracted data
- `automation/generated_ballot.html` - Ready-to-use ballot HTML
- `automation/audio_checklist.md` - Recording checklist
- `automation/last_processed_agenda.json` - Cache (prevents duplicates)

**Your audio files (you create):**

- `audio/item1-[slug].mp3`
- `audio/item2-[slug].mp3`
- etc.

-----

## Troubleshooting

### Scraper Runs But Finds Nothing

**Normal!** Means:

- No new agendas published yet
- Or agendas are more than 14 days away
- Or already processed this agenda

**It will keep checking every 6 hours.**

### Email Not Received

Check:

1. GitHub Actions ran successfully (check Actions tab)
1. Secrets are set correctly (EMAIL_USERNAME, EMAIL_PASSWORD, NOTIFICATION_EMAIL)
1. Gmail app password is valid
1. Check spam folder

### Scraper Fails

**Most common issue:** Municode site changed structure

**Fix:**

1. Go to Actions tab
1. Click failed run
1. Check error message
1. Report to Claude for adjustment

### Want to Run Manually

1. Go to Actions tab
1. Click “Check for New Council Agendas”
1. Click “Run workflow”
1. Select “main” branch
1. Click “Run workflow”

-----

## Customization Options

### Change Check Frequency

Edit `.github/workflows/check-agenda.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
```

Change to:

- `0 */3 * * *` - Every 3 hours
- `0 */12 * * *` - Every 12 hours
- `0 9,15,21 * * *` - 9am, 3pm, 9pm only

### Watch Other Meeting Types

Edit `automation/scraper.py`:

```python
MEETING_TYPE = "Common Council"
```

Change to:

- `"Board of Police"`
- `"Planning Commission"`
- etc.

Or add multiple in a list.

### Adjust Look-Ahead Window

Edit `automation/scraper.py`:

```python
CHECK_DAYS_AHEAD = 14  # Look 14 days ahead
```

Change to any number of days.

-----

## Cost

**$0.00/month**

- GitHub Actions: Free (2,000 minutes/month on public repos)
- This uses ~2 minutes per run
- 4 runs/day × 30 days = 120 runs = ~240 minutes/month
- Well within free tier

-----

## Privacy & Security

**What has access to what:**

- Scraper: Read-only access to municode public site
- GitHub Actions: Read/write to your repo only
- Email: Uses app password (revocable anytime)
- No external services
- No data leaves GitHub

**To revoke access:**

1. Delete app password from Google
1. Delete secrets from GitHub
1. Disable workflow

-----

## Support

**If automation breaks:**

1. Check Actions tab for error messages
1. Check if municode site changed
1. Contact Claude with error details

**To disable automation:**

1. Go to `.github/workflows/check-agenda.yml`
1. Add `#` in front of schedule lines
1. Or delete the workflow file

-----

## Next Steps After Setup

1. ✅ Complete setup steps above
1. ✅ Test manual run
1. ✅ Wait for first auto-run (within 6 hours)
1. ✅ When email arrives, follow workflow
1. ✅ Publish first automated ballot

**The machine runs itself. You just add the human touch (audio + review).**

-----

**Questions? Issues? Report them and we’ll fix the automation.**