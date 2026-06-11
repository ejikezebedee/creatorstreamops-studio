import { execFileSync } from "node:child_process";

const checks = [
  {
    name: "secret-material",
    patterns: [
      "AKIA[0-9A-Z]{16}",
      "-----BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----",
      "(api[_-]?key|secret|token|password)\\s*=\\s*['\\\"][^'\\\"]{12,}",
      "/root/",
      "\\.openclaw",
    ],
    globs: [],
  },
  {
    name: "platform-boundary-implementation",
    patterns: [
      "tiktok.*password",
      "view bot|follower generator|auto-like|auto-comment|mass dm|scrap(e|ing) live chat",
    ],
    globs: [
      "-g",
      "!README.md",
      "-g",
      "!docs/**",
      "-g",
      "!CREATORSTREAMOPS_FINAL_AUDIT_REPORT.md",
    ],
  },
];

let failed = false;
for (const check of checks) {
  for (const pattern of check.patterns) {
    try {
      execFileSync(
        "rg",
        [
          "-n",
          "--hidden",
          "-g",
          "!node_modules",
          "-g",
          "!dist",
          "-g",
          "!data",
          "-g",
          "!.git",
          "-g",
          "!scripts/scan-secrets.ts",
          ...check.globs,
          "--",
          pattern,
          ".",
        ],
        {
          stdio: "pipe",
        },
      );
      console.error(
        `Potential ${check.name} issue matched pattern: ${pattern}`,
      );
      failed = true;
    } catch (error) {
      if ((error as { status?: number }).status !== 1) throw error;
    }
  }
}

if (failed) process.exit(1);
console.log("Secret/platform-boundary scan passed.");
