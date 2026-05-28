#!/usr/bin/env node
// Reads the Val report, extracts severity counts, sets action outputs,
// and exits non-zero if findings exceed the user-configured threshold.
const fs = require("fs");

const reportPath = process.argv[2];
const failOn = (process.argv[3] || "high").toLowerCase();
const report = fs.readFileSync(reportPath, "utf8");

const m = report.match(/(\d+)\s+high,\s+(\d+)\s+medium,\s+(\d+)\s+low/);
const [high, medium, low] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];

const out = process.env.GITHUB_OUTPUT;
if (out) {
  fs.appendFileSync(out, `high=${high}\nmedium=${medium}\nlow=${low}\n`);
}

let exitCode = 0;
let reason = "";
if (failOn === "low" && high + medium + low > 0) {
  exitCode = 1;
  reason = `${high + medium + low} finding(s) at or above 'low'`;
} else if (failOn === "medium" && high + medium > 0) {
  exitCode = 1;
  reason = `${high + medium} finding(s) at or above 'medium'`;
} else if (failOn === "high" && high > 0) {
  exitCode = 1;
  reason = `${high} high-severity finding(s)`;
}

if (exitCode === 1) {
  console.error(`Val: failing the action because ${reason}.`);
} else {
  console.log(`Val: ${high} high, ${medium} medium, ${low} low. Within threshold (fail-on=${failOn}).`);
}
process.exit(exitCode);
