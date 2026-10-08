export function parseRoster(text) {
  text = text.replace(/^\uFEFF/, '');
  const delimiter = text.split(/\r?\n/, 1)[0].includes('\t') ? '\t' : ',';
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (!quoted && cell.trim()) throw Error('引号格式不正确');
      else quoted = !quoted;
    } else if (!quoted && (c === delimiter || c === '\n' || c === '\r')) {
      row.push(cell.trim()); cell = '';
      if (c !== delimiter) { if (row.some(Boolean)) rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
    } else cell += c;
  }
  if (quoted) throw Error('有未闭合的引号');
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  if (!rows.length) throw Error('请先上传或粘贴名单');
  const headers = rows[0].map(x => x.toLowerCase());
  const nameIndex = headers.findIndex(x => ['姓名','名字','name'].includes(x));
  const awardIndex = headers.findIndex(x => ['奖项','获奖奖项','奖项名称','award'].includes(x));
  const hasHeader = nameIndex >= 0 || awardIndex >= 0;
  if (hasHeader && (nameIndex < 0 || awardIndex < 0)) throw Error('表头需要同时包含「姓名」和「奖项」');
  const data = hasHeader ? rows.slice(1) : rows;
  if (!data.length || data.length > 100) throw Error('每批请填写 1–100 条记录');
  return data.map((r, i) => {
    const name = r[hasHeader ? nameIndex : 0], award = r[hasHeader ? awardIndex : 1];
    if (!name || !award) throw Error(`第 ${i + 1} 条记录缺少姓名或奖项`);
    if (name.length > 40 || award.length > 32) throw Error(`第 ${i + 1} 条记录过长（姓名最多 40 字，奖项最多 32 字）`);
    return { name, award };
  });
}

export function rosterFilename(record, index, ext) {
  const safe = s => s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^[. ]+|[. ]+$/g, '') || '奖章';
  return `${String(index + 1).padStart(3, '0')}-${safe(record.name)}-${safe(record.award)}.${ext}`;
}
