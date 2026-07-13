// Minimal i18n. Two languages, English default. t(lang, key, vars?) with {x} interpolation.

export type Lang = "en" | "cn";
export const DEFAULT_LANG: Lang = "en";

type Dict = Record<string, string>;

const en: Dict = {
  // nav / shell
  "nav.skills": "Skills",
  "nav.directories": "Directories",
  "nav.theme": "Theme",
  "nav.lang": "Language",

  // categories
  "cat.all": "All",
  "cat.installed": "Installed",
  "cat.whitelist": "Whitelist",
  "cat.searched": "Searched",
  "cat.installed.t": "Installed on this machine",
  "cat.whitelist.t": "Curated in data/whitelist.md (edit the file to change)",
  "cat.searched.t": "You searched this on GitHub but didn't install it",

  // skills page
  "skills.title": "Skills",
  "skills.sub": "Skills installed on this machine, a curated whitelist, and GitHub results you saved.",
  "skills.sync": "Update installed",
  "skills.syncing": "Updating…",
  "skills.search": "Search GitHub",
  "skills.keyword": "Keyword",
  "skills.fCategory": "Category",
  "skills.fTag": "Audience",
  "skills.apply": "Apply",
  "skills.reset": "Reset",
  "skills.sortBy": "Sort by",
  "skills.sort.name": "Name",
  "skills.sort.stars": "Stars",
  "skills.allTags": "All audiences",

  // columns
  "col.skill": "Skill",
  "col.category": "Where",
  "col.audience": "Audience",
  "col.description": "Description",
  "col.action": "Action",

  // actions
  "act.install": "Install",
  "act.installing": "Installing…",
  "act.update": "Update",
  "act.deleteGuide": "How to remove",
  "act.openGithub": "Open on GitHub",
  "act.confirmSync": "Update all installed git skills now (git pull)?",
  "act.onlyLocal": "This action only works when running locally.",
  "act.installedAt": "Installed via {provider} at {dir}",

  // install picker
  "inst.title": "Install \"{name}\"",
  "inst.pickDir": "Choose where to install:",
  "inst.noRepo": "This entry has no GitHub repo, so it can't be auto-installed.",
  "inst.noDir": "No skills directory detected. Add one on the Directories page first.",
  "inst.go": "Install here",
  "inst.cancel": "Cancel",

  // delete guide
  "del.title": "Remove \"{name}\"",
  "del.intro": "Skill Radar never deletes files for you. To remove this skill, delete its folder yourself:",
  "del.folder": "Folder",
  "del.command": "Command",
  "del.copy": "Copy",
  "del.copied": "Copied",
  "del.pluginNote": "This is a Claude plugin — don't delete the folder by hand. Uninstall it with /plugin in Claude Code.",
  "del.gstackNote": "Bundle-managed skills (gstack / plugins) are best removed via their manager, not rm.",
  "del.close": "Close",

  // directories page
  "dir.title": "Skill Directories",
  "dir.sub": "Where each agent runner keeps its skills. Detected automatically; add your own below.",
  "dir.detected": "Detected",
  "dir.notFound": "Not found",
  "dir.builtin": "built-in",
  "dir.custom": "custom",
  "dir.create": "Create folder",
  "dir.creating": "Creating…",
  "dir.remove": "Remove",
  "dir.addTitle": "Add a skills directory",
  "dir.addLabel": "Label",
  "dir.addPath": "Absolute path",
  "dir.addLabelPh": "e.g. My extra skills",
  "dir.addPathPh": "/Users/you/some/skills",
  "dir.add": "Add",
  "dir.adding": "Adding…",
  "dir.count": "{n} skill(s)",
  "dir.emptyDetected": "No skill directories detected yet. Add one below or create a built-in path.",

  // github search page
  "search.title": "Search GitHub for skills",
  "search.ph": "Search skills (e.g. testing, design, planning)…",
  "search.go": "Search",
  "search.searching": "Searching…",
  "search.empty": "Type a keyword and search GitHub for skills.",
  "search.noResults": "No results.",
  "search.rateLimited": "GitHub rate limit hit. Wait a minute, or set GITHUB_TOKEN in your environment to raise the limit.",
  "search.installed": "installed",
  "search.whitelisted": "whitelist",
  "search.viewDetail": "Details",
  "search.stars": "{n} ★",

  // detail page
  "detail.back": "Back to search",
  "detail.install": "Install",
  "detail.save": "Save (didn't install)",
  "detail.saved": "Saved to your searched list.",
  "detail.readmeMissing": "No README found for this repository.",
  "detail.loading": "Loading…",

  // empty / misc
  "empty.noMatch": "No matching skill.",
  "empty.noneAtAll": "No skills yet. Add a directory, or search GitHub to find some.",
  "common.github": "GitHub",
  "common.local": "local",
};

const cn: Dict = {
  "nav.skills": "Skills",
  "nav.directories": "目录",
  "nav.theme": "主题",
  "nav.lang": "语言",

  "cat.all": "全部",
  "cat.installed": "已安装",
  "cat.whitelist": "白名单",
  "cat.searched": "搜过",
  "cat.installed.t": "本机已安装",
  "cat.whitelist.t": "在 data/whitelist.md 维护（改文件才能改）",
  "cat.searched.t": "你在 GitHub 搜过但没装",

  "skills.title": "Skills",
  "skills.sub": "本机已装的 skills、一个手工维护的白名单，以及你保存过的 GitHub 结果。",
  "skills.sync": "更新已装",
  "skills.syncing": "更新中…",
  "skills.search": "搜索 GitHub",
  "skills.keyword": "关键字",
  "skills.fCategory": "分类",
  "skills.fTag": "适合谁",
  "skills.apply": "应用",
  "skills.reset": "重置",
  "skills.sortBy": "排序",
  "skills.sort.name": "名称",
  "skills.sort.stars": "Star",
  "skills.allTags": "所有对象",

  "col.skill": "Skill",
  "col.category": "来源",
  "col.audience": "适合谁",
  "col.description": "描述",
  "col.action": "操作",

  "act.install": "安装",
  "act.installing": "安装中…",
  "act.update": "更新",
  "act.deleteGuide": "如何删除",
  "act.openGithub": "在 GitHub 打开",
  "act.confirmSync": "现在更新所有已装的 git skills（git pull）？",
  "act.onlyLocal": "这个动作只有本地运行才能用。",
  "act.installedAt": "由 {provider} 安装在 {dir}",

  "inst.title": "安装「{name}」",
  "inst.pickDir": "选择安装到哪里：",
  "inst.noRepo": "这个条目没有 GitHub repo，无法自动安装。",
  "inst.noDir": "没检测到任何 skills 目录，请先到「目录」页添加一个。",
  "inst.go": "装到这里",
  "inst.cancel": "取消",

  "del.title": "删除「{name}」",
  "del.intro": "Skill Radar 不会替你删文件。要删除这个 skill，请自己删掉它的文件夹：",
  "del.folder": "文件夹",
  "del.command": "命令",
  "del.copy": "复制",
  "del.copied": "已复制",
  "del.pluginNote": "这是一个 Claude plugin —— 不要手动删文件夹。请在 Claude Code 用 /plugin 卸载。",
  "del.gstackNote": "打包管理的 skills（gstack / plugin）最好用它们的管理器删，别用 rm。",
  "del.close": "关闭",

  "dir.title": "Skill 目录",
  "dir.sub": "每个 agent runner 存放 skills 的位置。自动检测；也可在下面添加你自己的。",
  "dir.detected": "已检测",
  "dir.notFound": "未找到",
  "dir.builtin": "内置",
  "dir.custom": "自定义",
  "dir.create": "创建文件夹",
  "dir.creating": "创建中…",
  "dir.remove": "移除",
  "dir.addTitle": "添加一个 skills 目录",
  "dir.addLabel": "名称",
  "dir.addPath": "绝对路径",
  "dir.addLabelPh": "例如：我的额外 skills",
  "dir.addPathPh": "/Users/you/some/skills",
  "dir.add": "添加",
  "dir.adding": "添加中…",
  "dir.count": "{n} 个 skill",
  "dir.emptyDetected": "还没检测到任何 skills 目录。可在下面添加，或创建一个内置路径。",

  "search.title": "在 GitHub 搜 skills",
  "search.ph": "搜索 skills（例如 testing、design、planning）…",
  "search.go": "搜索",
  "search.searching": "搜索中…",
  "search.empty": "输入关键字，在 GitHub 上搜 skills。",
  "search.noResults": "没有结果。",
  "search.rateLimited": "触发 GitHub 频率限制。等一分钟，或在环境里设 GITHUB_TOKEN 提高额度。",
  "search.installed": "已装",
  "search.whitelisted": "白名单",
  "search.viewDetail": "详情",
  "search.stars": "{n} ★",

  "detail.back": "返回搜索",
  "detail.install": "安装",
  "detail.save": "保存（没装）",
  "detail.saved": "已存进你的 searched 列表。",
  "detail.readmeMissing": "这个仓库没有 README。",
  "detail.loading": "加载中…",

  "empty.noMatch": "没有匹配的 skill。",
  "empty.noneAtAll": "还没有任何 skill。添加一个目录，或搜索 GitHub 找一些。",
  "common.github": "GitHub",
  "common.local": "本地",
};

const DICTS: Record<Lang, Dict> = { en, cn };

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
  return s;
}
