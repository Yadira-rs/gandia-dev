const fs = require("fs");
const path = require("path");

const ignore = [
  "node_modules",
  ".expo",
  ".git",
  ".expo-shared",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "dist",
  "build"
];

let output = "# Project Structure\n\n```\n";

function tree(dir, prefix = "") {
  const files = fs
    .readdirSync(dir)
    .filter(file => !ignore.includes(file));

  files.forEach((file, index) => {
    const full = path.join(dir, file);
    const isLast = index === files.length - 1;
    const line = prefix + (isLast ? "└── " : "├── ") + file;

    output += line + "\n";

    if (fs.statSync(full).isDirectory()) {
      tree(full, prefix + (isLast ? "    " : "│   "));
    }
  });
}

tree(process.cwd());

output += "```\n";

fs.writeFileSync("STRUCTURE.md", output);

console.log("✅ STRUCTURE.md generado");