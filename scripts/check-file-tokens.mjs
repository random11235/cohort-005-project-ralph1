#!/usr/bin/env node
// Fails when a file is over MAX_TOKENS, estimated as bytes / 4.
//
// Usage:
//   node scripts/check-file-tokens.mjs            # checks staged files (pre-commit)
//   node scripts/check-file-tokens.mjs a.ts b.md  # checks the named files
//
// Big files are hard for agents to read: they get truncated, or eat the
// context window. The message below tells the agent how to split the file.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const MAX_TOKENS = 5000;
const BYTES_PER_TOKEN = 4;

// Generated or vendored files nobody reads by hand.
const IGNORED = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)[\w-]*-lock\.json$/,
  /\.lock$/,
  /^drizzle\//,
  /\.snap$/,
  /\.(db|db-shm|db-wal|png|jpe?g|gif|webp|ico|svg|woff2?|mp4|pdf)$/,
];

function git(...args) {
  return execFileSync("git", args, { encoding: "buffer" });
}

function stagedFiles() {
  return git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

/** The bytes that will actually be committed, not the working tree copy. */
function stagedBytes(file) {
  return git("show", `:${file}`);
}

function isBinary(bytes) {
  return bytes.subarray(0, 8000).includes(0);
}

function guidance(file) {
  if (/\.test\.tsx?$/.test(file)) {
    return [
      "This is a test file. Split it by behaviour, one file per behaviour or",
      "per describe block, e.g. `refunds.window.test.ts`, `refunds.approval.test.ts`.",
      "Move shared arrange helpers into a fixture file next to the tests",
      "(inside the module's `tests/` folder if it belongs to a module).",
    ];
  }
  if (/^app\/routes\//.test(file)) {
    return [
      "This is a route. A route should be thin: parse input, call a module,",
      "render. Move loader/action logic (queries, permission rules, business",
      "rules) into a deep module under `app/modules/<name>/` and import it",
      "through its entry point. Read `app/modules/README.md` first.",
      "Move large pieces of JSX into components under `app/components/`,",
      "one component per file.",
    ];
  }
  if (/\.tsx$/.test(file)) {
    return [
      "This is a component file. Split out each sub-component that has its own",
      "reason to change into its own file, and move non-UI logic (formatting,",
      "derivations, data shaping) into a plain `.ts` module beside it.",
    ];
  }
  if (/\.mdx?$/.test(file)) {
    return [
      "This is a document. Split it into several focused documents and link",
      "them from a short index, so a reader loads only the part they need.",
      "Delete anything a lint rule, type or test already enforces.",
    ];
  }
  return [
    "Split the file along its responsibilities. Find the groups of functions",
    "that change together and move each group to its own file. If the file",
    "is a module's implementation, keep the entry point small and put the",
    "pieces under the module's `lib/` folder (see `app/modules/README.md`).",
    "If it is a script, move data or fixtures into separate files.",
  ];
}

const args = process.argv.slice(2);
const files = (args.length > 0 ? args : stagedFiles()).filter(
  (file) => !IGNORED.some((pattern) => pattern.test(file))
);

const failures = [];
for (const file of files) {
  const bytes = args.length > 0 ? readFileSync(file) : stagedBytes(file);
  if (isBinary(bytes)) continue;
  const tokens = Math.ceil(bytes.length / BYTES_PER_TOKEN);
  if (tokens > MAX_TOKENS) failures.push({ file, tokens });
}

if (failures.length > 0) {
  console.error(
    `\n✖ ${failures.length} file(s) over ${MAX_TOKENS} tokens (estimated as bytes / ${BYTES_PER_TOKEN}):\n`
  );
  for (const { file, tokens } of failures) {
    console.error(`  ${file}: ~${tokens} tokens`);
    for (const line of guidance(file)) console.error(`    ${line}`);
    console.error("");
  }
  console.error(
    [
      "How to fix: split each file as described above, run the checks",
      "(`npm run check`), stage the new files, and commit again.",
      "Do not shrink a file by deleting comments, minifying, or cramming lines",
      "together, and do not bypass this hook with --no-verify.",
      "",
    ].join("\n")
  );
  process.exit(1);
}
