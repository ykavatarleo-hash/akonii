// update-counter.js
//
// Fetches the Akonii Roblox group's member count and, if it has changed
// since the last run, posts a milestone-style embed to Discord via webhook.
//
// State (the last known member count) is stored in state.json and committed
// back to the repo by the GitHub Actions workflow, so the script "remembers"
// the previous count between runs.

const fs = require("fs");
const path = require("path");

const GROUP_ID = process.env.ROBLOX_GROUP_ID || "34423278"; // Akonii
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const EMBED_COLOR_HEX = process.env.EMBED_COLOR_HEX || "#3f5a36";
const MILESTONE_STEP = parseInt(process.env.MILESTONE_STEP || "100", 10);
const GROUP_NAME = process.env.GROUP_DISPLAY_NAME || "Akonii";

const STATE_FILE = path.join(__dirname, "state.json");

function hexToDecimal(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

async function getRobloxMemberCount(groupId) {
  const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
  if (!res.ok) {
    throw new Error(`Roblox API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    name: data.name,
    memberCount: data.memberCount,
  };
}

function readLastCount() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed.lastCount === "number" ? parsed.lastCount : null;
  } catch (err) {
    return null; // no state file yet, first run
  }
}

function writeLastCount(count) {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ lastCount: count, updatedAt: new Date().toISOString() }, null, 2)
  );
}

// Next milestone is the next multiple of MILESTONE_STEP strictly above the current count.
function nextMilestone(count) {
  return (Math.floor(count / MILESTONE_STEP) + 1) * MILESTONE_STEP;
}

async function postMilestoneEmbed(memberCount) {
  const milestone = nextMilestone(memberCount);
  const untilNext = milestone - memberCount;

  const body = {
    embeds: [
      {
        description: `🎉 **${GROUP_NAME}** has now reached **${memberCount.toLocaleString()}** members! **${untilNext.toLocaleString()}** members until **${milestone.toLocaleString()}**!`,
        color: hexToDecimal(EMBED_COLOR_HEX),
      },
    ],
  };

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook error: ${res.status} ${text}`);
  }
}

async function main() {
  if (!WEBHOOK_URL) {
    throw new Error("Missing DISCORD_WEBHOOK_URL secret/env var.");
  }

  const { name, memberCount } = await getRobloxMemberCount(GROUP_ID);
  console.log(`Fetched: ${name} -> ${memberCount} members`);

  const lastCount = readLastCount();
  console.log(`Last known count: ${lastCount}`);

  if (lastCount === memberCount) {
    console.log("Count unchanged. Skipping Discord post.");
    return;
  }

  await postMilestoneEmbed(memberCount);
  console.log("Posted update to Discord.");

  writeLastCount(memberCount);
  console.log("Updated state.json with new count.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
