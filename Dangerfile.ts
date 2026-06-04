import { danger, warn, fail, message } from 'danger';

const { pr } = danger.github;
const modifiedFiles = danger.git.modified_files;
const createdFiles = danger.git.created_files;
const allChangedFiles = [...modifiedFiles, ...createdFiles];

// ── PR size warning ─────────────────────────────────────────────────────────
const bigPRThreshold = 500;
if (pr.additions + pr.deletions > bigPRThreshold) {
  warn(`PR lớn (${pr.additions + pr.deletions} dòng thay đổi). Cân nhắc chia nhỏ hơn.`);
}

// ── PR description ──────────────────────────────────────────────────────────
if (!pr.body || pr.body.trim().length < 30) {
  fail('PR cần có mô tả (ít nhất 30 ký tự). Giải thích vấn đề và cách giải quyết.');
}

// ── CHANGELOG reminder ──────────────────────────────────────────────────────
const hasChangelog = modifiedFiles.includes('CHANGELOG.md');
const hasSourceChanges = allChangedFiles.some(
  f => f.startsWith('app/') || f.startsWith('components/') || f.startsWith('services/')
);
if (hasSourceChanges && !hasChangelog) {
  warn('Có thay đổi source code nhưng CHANGELOG.md chưa được cập nhật.');
}

// ── Test coverage reminder ──────────────────────────────────────────────────
const hasNewComponent = createdFiles.some(f => f.startsWith('components/') && f.endsWith('.tsx'));
const hasNewTest = createdFiles.some(f => f.includes('__tests__') && f.endsWith('.test.tsx'));
if (hasNewComponent && !hasNewTest) {
  warn('Component mới được thêm nhưng không có test tương ứng trong `__tests__/`.');
}

// ── No console.log in source ────────────────────────────────────────────────
const srcFiles = allChangedFiles.filter(
  f =>
    (f.startsWith('app/') || f.startsWith('components/') || f.startsWith('services/')) &&
    (f.endsWith('.ts') || f.endsWith('.tsx'))
);
for (const file of srcFiles) {
  const content = danger.github.utils.fileContents(file);
  if (content && /console\.log\(/.test(content)) {
    warn(`\`console.log\` found in ${file} — dùng logger thay thế.`);
  }
}

// ── Label automation ────────────────────────────────────────────────────────
const labels: string[] = [];
if (allChangedFiles.some(f => f.startsWith('app/admin/'))) labels.push('admin');
if (allChangedFiles.some(f => f.startsWith('app/(tabs)/'))) labels.push('ui');
if (allChangedFiles.some(f => f.startsWith('services/'))) labels.push('services');
if (allChangedFiles.some(f => f.startsWith('locales/'))) labels.push('i18n');
if (allChangedFiles.some(f => f.includes('__tests__'))) labels.push('tests');
if (allChangedFiles.some(f => f.endsWith('.yml') || f.endsWith('.yaml'))) labels.push('ci');

if (labels.length > 0) {
  message(`🏷 Auto-labels: ${labels.map(l => `\`${l}\``).join(', ')}`);
}
