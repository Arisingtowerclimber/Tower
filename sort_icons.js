// Раскладка иконок из assets/icons по категориям на основе имени файла.
// Запуск: node sort_icons.js
const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "assets", "icons");
const JS_DIR = path.join(__dirname, "js");
const ICON_PATH_PREFIX = "assets/icons/";

// Порядок важен: первое совпадение выигрывает.
const RULES = [
  { words: ["sword", "rapier"], dir: "weapons/swords" },
  { words: ["axe", "hatchet"], dir: "weapons/axes" },
  { words: ["mace", "maul", "hammer"], dir: "weapons/maces" },
  { words: ["spear"], dir: "weapons/spears" },
  { words: ["head"], dir: "armor/head" },
  { words: ["chest"], dir: "armor/chest" },
  { words: ["hands", "gloves"], dir: "armor/hands" },
  { words: ["legs", "pants"], dir: "armor/legs" },
  { words: ["feet", "boots"], dir: "armor/feet" },
  { words: ["shoulders"], dir: "armor/shoulders" },
  { words: ["shield"], dir: "shields" },
  { words: ["ring"], dir: "accessories/rings" },
  { words: ["neck"], dir: "accessories/necks" },
  { words: ["trinket"], dir: "accessories/trinkets" },
];

const FALLBACK_DIR = "misc";

function targetDir(fileName) {
  const lower = fileName.toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((word) => lower.includes(word))) return rule.dir;
  }
  return FALLBACK_DIR;
}

// После перемещения иконки лежат по новым путям, а в js/*.js остались старые
// плоские ссылки вида "assets/icons/iron_long_sword.png". Переписываем их,
// иначе игра потеряет все иконки.
function rewriteIconPaths(moves) {
  if (!fs.existsSync(JS_DIR)) return { files: 0, links: 0 };

  let changedFiles = 0;
  let changedLinks = 0;

  for (const name of fs.readdirSync(JS_DIR)) {
    if (!name.endsWith(".js")) continue;

    const filePath = path.join(JS_DIR, name);
    const before = fs.readFileSync(filePath, "utf8");
    let after = before;

    for (const move of moves) {
      const from = ICON_PATH_PREFIX + move.fileName;
      const to = `${ICON_PATH_PREFIX}${move.rel}/${move.fileName}`;
      const parts = after.split(from);
      if (parts.length === 1) continue;
      after = parts.join(to);
      changedLinks += parts.length - 1;
    }

    if (after !== before) {
      fs.writeFileSync(filePath, after, "utf8");
      changedFiles++;
    }
  }

  return { files: changedFiles, links: changedLinks };
}

function main() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Папка не найдена: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(ICONS_DIR)
    .filter((name) => fs.statSync(path.join(ICONS_DIR, name)).isFile());

  const movedByDir = {};
  const moves = [];
  let moved = 0;

  for (const fileName of files) {
    const rel = targetDir(fileName);
    const destDir = path.join(ICONS_DIR, ...rel.split("/"));
    const from = path.join(ICONS_DIR, fileName);
    const to = path.join(destDir, fileName);

    fs.mkdirSync(destDir, { recursive: true });
    fs.renameSync(from, to);

    moves.push({ fileName, rel });
    movedByDir[rel] = (movedByDir[rel] || 0) + 1;
    moved++;
  }

  const rewritten = rewriteIconPaths(moves);

  console.log(`Перемещено файлов: ${moved}`);
  for (const rel of Object.keys(movedByDir).sort()) {
    console.log(`  assets/icons/${rel}/ — ${movedByDir[rel]}`);
  }
  console.log(
    `Ссылок обновлено: ${rewritten.links} в файлах: ${rewritten.files}`
  );
}

main();
