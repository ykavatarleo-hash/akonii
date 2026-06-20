# Akonii Member Counter for Discord

Posts a milestone-style announcement to Discord whenever your Roblox group
(Akonii) gains or loses members, via GitHub Actions — no hosting required.

Example message it posts (as a colored embed):

> 🎉 **Akonii** has now reached **1,234** members! **66** members until **1,300**!

## What's already configured

- **Group:** Akonii (Group ID `34423278`)
- **Milestone step:** every 100 members
- **Embed color:** `#3f5a36`
- **Posts only when the count changes** (not on a fixed schedule regardless of change)
- **Check frequency:** every 5 minutes

### A note on "every 1 minute"

You asked for 1-minute updates, but GitHub Actions doesn't reliably support
that. Scheduled workflows faster than ~5 minutes get queued and delayed by
GitHub during busy periods, so a 1-minute cron wouldn't actually give you
1-minute updates — it would just queue extra runs that get skipped or run
late. 5 minutes is the fastest interval GitHub generally honors close to
on-time, so that's what's set up. Since the script also only posts when the
count actually *changes*, you won't get spam either way — it just checks
more or less often.

## ⚠️ Important: regenerate your webhook

You shared your Discord webhook URL in this conversation. Anyone with that
URL can post messages into your channel. Before/after setting this up,
go to **Discord → Channel Settings → Integrations → Webhooks** and reset
the token, then use the **new** URL in the GitHub secret below. Treat
webhook URLs like passwords — never share them publicly (e.g. in a repo,
Discord message, or anywhere public).

## Setup

### 1. Create the repo

Create a new GitHub repository (private is fine) and upload these files,
keeping the folder structure:

```
update-counter.js
state.json
.github/workflows/update-counter.yml
```

### 2. Add repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `DISCORD_WEBHOOK_URL` | Your (regenerated) Discord webhook URL |
| `ROBLOX_GROUP_ID` | `34423278` |
| `EMBED_COLOR_HEX` | `#3f5a36` |
| `MILESTONE_STEP` | `100` |
| `GROUP_DISPLAY_NAME` | `Akonii` |

(The last four have defaults baked into the script, so technically only
`DISCORD_WEBHOOK_URL` is required — but setting them explicitly as secrets
makes them easy to change later without editing code.)

### 3. Enable workflow write permissions

This workflow commits an updated `state.json` back to your repo each time
the count changes, so it needs write access:

- Go to **Settings → Actions → General**
- Under "Workflow permissions," select **"Read and write permissions"**
- Save

(The workflow file also explicitly requests `contents: write`, but this
repo setting needs to allow it too.)

### 4. Test it

- Go to the **Actions** tab → "Update Akonii Member Counter" → **Run workflow**
- Check your Discord channel for the embed message
- Check that `state.json` got updated with the current count (commit history)

### 5. Done

Once secrets are set and permissions enabled, it runs automatically every
5 minutes via the schedule in the workflow file. Nothing to host or keep
running yourself.

## How the milestone logic works

- It tracks the **next multiple of 100 above your current count**.
- E.g. at 1,234 members → next milestone is 1,300, so it shows "66 members
  until 1,300."
- At exactly 1,300, the next milestone becomes 1,400.

## Customizing later

- **Change milestone step:** edit the `MILESTONE_STEP` secret (e.g. `500` or `1000`).
- **Change embed color:** edit the `EMBED_COLOR_HEX` secret (hex format, with or without `#`).
- **Change the message wording:** edit the `description` string in `update-counter.js`.
- **Change check frequency:** edit the `cron` line in the workflow file
  (lower than 5 min isn't recommended — GitHub will throttle it anyway).
