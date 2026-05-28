#!/usr/bin/env node
// Posts the Val report as a comment on the current PR. Replaces a prior
// Val comment if one exists so we don't pile up noise across runs.
const fs = require("fs");

async function main() {
  const reportPath = process.argv[2] || "val-report.txt";
  const report = fs.readFileSync(reportPath, "utf8");

  const eventPath = process.env.GITHUB_EVENT_PATH;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!eventPath || !token || !repo) {
    console.error("Val: missing GITHUB_EVENT_PATH / GITHUB_TOKEN / GITHUB_REPOSITORY, skipping comment.");
    return;
  }
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const prNumber = event.pull_request && event.pull_request.number;
  if (!prNumber) {
    console.error("Val: not running in a pull_request event, skipping comment.");
    return;
  }

  const MARKER = "<!-- val-qa-comment -->";
  const truncated = report.length > 6000 ? report.slice(0, 6000) + "\n... (truncated)" : report;
  const body =
    `${MARKER}\n` +
    `### 🤖 Val QA scan\n\n` +
    "```\n" + truncated + "\n```\n\n" +
    "_Catch every bug, ship to green. Powered by [Val](https://val.nyx-intelligence.com)._";

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "val-action",
  };

  // Find an existing Val comment to update (avoid spam).
  const list = await fetch(
    `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`,
    { headers },
  );
  if (list.ok) {
    const comments = await list.json();
    const existing = Array.isArray(comments) ? comments.find((c) => typeof c.body === "string" && c.body.includes(MARKER)) : null;
    if (existing) {
      const upd = await fetch(`https://api.github.com/repos/${repo}/issues/comments/${existing.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ body }),
      });
      if (!upd.ok) {
        console.error("Val: failed to update comment:", upd.status, await upd.text());
        process.exit(1);
      }
      console.log(`Val: updated comment #${existing.id}.`);
      return;
    }
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    console.error("Val: failed to post comment:", res.status, await res.text());
    process.exit(1);
  }
  console.log("Val: comment posted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
