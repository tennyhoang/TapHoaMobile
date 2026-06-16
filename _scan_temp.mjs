const fs = require("fs");
const path = require("path");

function getAllFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, ext));
    } else if (ext.some(e => file.endsWith(e))) {
      results.push(filePath);
    }
  });
  return results;
}

const files = [...getAllFiles("app", [".tsx", ".ts"]), ...getAllFiles("components", [".tsx", ".ts"])];

const issues = [];

const patterns = [
  { rule: "side-stripe-border", regex: /borderLeftWidth\s*:\s*[2-9]|borderRightWidth\s*:\s*[2-9]|borderLeftColor|borderRightColor/, desc: "Side-stripe border accent (borderLeft/Right as accent)" },
  { rule: "gradient-text", regex: /backgroundClip.*text/, desc: "Gradient text" },
  { rule: "pure-black", regex: /#000["']|["']#000["']|["']black["']/, desc: "Pure black color" },
  { rule: "pure-white", regex: /#fff["']|["']#fff["']|["']white["']/, desc: "Pure white color" },
  { rule: "hardcoded-hex-color", regex: /(?:color|backgroundColor|borderColor|tintColor)\s*:\s*"#[0-9a-fA-F]{3,8}"/, desc: "Hard-coded hex color" },
  { rule: "modal-usage", regex: /<Modal[\s>]/, desc: "Modal usage (verify inline alternatives were considered)" },
  { rule: "em-dash", regex: /—|&mdash;|&#8212;/, desc: "Em dash in copy" },
  { rule: "linear-gradient", regex: /LinearGradient|linear-gradient/, desc: "Linear gradient (ensure purposeful)" },
  { rule: "blur-glass", regex: /BlurView|blurRadius\s*:/, desc: "Blur/glass effect" },
  { rule: "absolute-position", regex: /position\s*:\s*["']absolute["']/, desc: "Absolute positioning (potential layout anti-pattern)" },
  { rule: "hardcoded-shadow", regex: /shadowColor\s*:\s*["']#[0-9a-fA-F]/, desc: "Hard-coded shadow color" },
  { rule: "same-padding-all", regex: /padding\s*:\s*\d+/, desc: "Hard-coded padding value" }
];

files.forEach(file => {
  let content;
  try { content = fs.readFileSync(file, "utf8"); } catch(e) { return; }
  const lines = content.split("\n");
  patterns.forEach(({ rule, regex, desc }) => {
    lines.forEach((line, idx) => {
      const r = new RegExp(regex.source, regex.flags);
      if (r.test(line)) {
        issues.push({
          file: file.replace(/\\/g, "/"),
          line: idx + 1,
          rule,
          description: desc,
          snippet: line.trim().substring(0, 120)
        });
      }
    });
  });
});

// Summarize by file
const byFile = {};
issues.forEach(i => {
  if (!byFile[i.file]) byFile[i.file] = 0;
  byFile[i.file]++;
});

const topFiles = Object.entries(byFile)
  .sort((a,b) => b[1]-a[1])
  .slice(0, 15)
  .map(([file, count]) => ({ file, count }));

const byRule = {};
issues.forEach(i => {
  if (!byRule[i.rule]) byRule[i.rule] = 0;
  byRule[i.rule]++;
});

console.log(JSON.stringify({ total: issues.length, byRule, topFiles, issues }, null, 2));
