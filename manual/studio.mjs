import { drawPoster } from './poster.mjs';

const copy = {
  zh: {
    brand: '每日新闻制图', autoVersion: '自动新闻版', language: '界面语言', heading: '把你整理的新闻做成一张图',
    intro: '选日期，录入标题或导入文本，在浏览器里生成 PNG。', controls: '日期和内容', date: '图片日期',
    today: '今天', paste: '新闻标题', hint: '每行一条标题。可在标题后加竖线和来源链接。最多录入 12 条，每张图最多选 6 条。',
    placeholder: '你整理的标题 | https://example.com/story', generate: '生成预览', import: '导入 TXT',
    example: '试用虚构示例', preview: '图片预览', download: '下载 PNG', empty: '输入标题后，点击「生成预览」。',
    invalidDate: '请选择一个有效日期。', noStories: '请至少输入一条标题。', max: '每张图最多选择 6 条。',
    tooMany: '最多录入 12 条标题。请删减后再生成。', choose: '选入图片的条目', picked: n => '已选 ' + n + ' / 6 条',
    fileError: '无法读取文件。请选择 UTF-8 编码的 TXT 文件，不超过 24 KB。', imported: '文本已导入，可以先编辑，再点「生成预览」。',
    ready: '已生成 PNG。', downloadError: '无法生成 PNG，请重试。', userSource: '用户录入内容',
    exampleSource: '虚构示例 · 仅演示排版', exampleTitles: ['虚构示例｜社区图书角今日开放', '虚构示例｜周末举办公园写生活动']
  },
  en: {
    brand: 'Daily News Studio', autoVersion: 'Automatic news', language: 'Interface language', heading: 'Turn your headlines into a poster',
    intro: 'Choose a date, enter or import headlines, and create a PNG in your browser.', controls: 'Date and content', date: 'Poster date',
    today: 'Today', paste: 'Headlines', hint: 'Enter one headline per line. An optional pipe can separate it from its source link. Enter up to 12 headlines and select up to 6.',
    placeholder: 'Your headline | https://example.com/story', generate: 'Generate preview', import: 'Import TXT',
    example: 'Try fictional examples', preview: 'Poster preview', download: 'Download PNG', empty: 'Enter headlines, then select “Generate preview”.',
    invalidDate: 'Select a valid date.', noStories: 'Enter at least one headline.', max: 'Select up to 6 headlines per poster.',
    tooMany: 'Enter at most 12 headlines, then generate the preview again.', choose: 'Headlines on the poster', picked: n => n + ' of 6 headlines selected',
    fileError: 'Could not read the file. Choose a UTF-8 TXT file up to 24 KB.', imported: 'Text imported. Edit it if needed, then select “Generate preview”.',
    ready: 'PNG created.', downloadError: 'Could not create the PNG. Try again.', userSource: 'User-provided content',
    exampleSource: 'Fictional sample · Layout demo', exampleTitles: ['Fictional sample: Neighborhood reading corner opens', 'Fictional sample: Weekend sketching event in the park']
  }
};

const get = id => document.getElementById(id);
const dateInput = get('date');
const input = get('paste');
const canvas = get('poster');
let language = 'zh';
try { if (localStorage.getItem('daily-news-language') === 'en') language = 'en'; } catch {}
const t = key => copy[language][key];

let stories = [], selected = new Set(), sample = false, status = '';
let renderedDate;
let inputRevision = 0;

function today() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => String(part).padStart(index ? 2 : 4, '0')).join('-');
}

function posterDate() {
  const value = dateInput.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function sourceLink(value) {
  try {
    const url = new URL(value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url;
  } catch {}
  return null;
}

function setStatus(key = '') {
  status = key;
  get('status').textContent = key ? t(key) : stories.length ? t('picked')(selected.size) : '';
}

function refreshLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('brand');
  get('language').value = language;
  for (const node of document.querySelectorAll('[data-copy]')) node.textContent = t(node.dataset.copy);
  input.placeholder = t('placeholder');
  canvas.setAttribute('aria-label', t('preview'));
}

function renderStories() {
  get('story-picker').hidden = stories.length === 0;
  get('stories').replaceChildren(...stories.map((story, index) => {
    const row = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'story-' + index;
    checkbox.checked = selected.has(index);
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = story.title;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && selected.size === 6) {
        checkbox.checked = false;
        setStatus('max');
        return;
      }
      if (checkbox.checked) selected.add(index);
      else selected.delete(index);
      renderPoster();
      setStatus();
    });
    row.append(checkbox, label);
    if (story.url) {
      const link = document.createElement('a');
      link.href = story.url.href;
      link.textContent = story.url.hostname;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      row.append(link);
    }
    return row;
  }));
}

function renderPoster() {
  const date = posterDate();
  const chosen = stories.filter((_, index) => selected.has(index));
  const visible = Boolean(date && chosen.length);
  renderedDate = visible ? dateInput.value : undefined;
  canvas.hidden = !visible;
  get('empty').hidden = visible;
  get('download').disabled = !visible;
  if (!visible) return;
  const dateLabel = new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en', {
    dateStyle: 'full', timeZone: 'UTC'
  }).format(date);
  drawPoster(canvas, {
    date: dateLabel, title: t('brand'), source: t(sample ? 'exampleSource' : 'userSource'),
    stories: chosen.map(story => ({ title: story.title, from: story.url?.hostname ?? '' })), language
  });
}

function clearPoster() {
  stories = [];
  selected.clear();
  renderStories();
  renderPoster();
}

function applyContent() {
  if (!posterDate()) { clearPoster(); setStatus('invalidDate'); return; }
  const rows = input.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!rows.length) { clearPoster(); setStatus('noStories'); return; }
  if (rows.length > 12) { clearPoster(); setStatus('tooMany'); return; }
  stories = rows.map(line => {
    const parts = line.match(/^(.*?)\s*\|\s*(https?:\/\/\S+)$/i);
    const url = parts ? sourceLink(parts[2]) : null;
    return {title: url && parts[1].trim() ? parts[1].trim() : line, url};
  });
  selected = new Set(stories.slice(0, 6).map((_, index) => index));
  renderStories();
  renderPoster();
  setStatus();
}

dateInput.value = today();
dateInput.addEventListener('change', () => {
  renderPoster();
  setStatus(posterDate() ? '' : 'invalidDate');
});
get('today').onclick = () => { dateInput.value = today(); renderPoster(); setStatus(); };
input.addEventListener('input', () => {
  inputRevision++;
  sample = false;
  clearPoster();
  setStatus();
});
get('content-form').addEventListener('submit', event => { event.preventDefault(); applyContent(); });
get('example').onclick = () => {
  inputRevision++;
  sample = true;
  input.value = t('exampleTitles').join('\n');
  if (!posterDate()) dateInput.value = today();
  applyContent();
};
get('language').onchange = event => {
  language = event.target.value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem('daily-news-language', language); } catch {}
  refreshLanguage();
  if (sample) {
    input.value = t('exampleTitles').join('\n');
    stories = t('exampleTitles').map(title => ({ title }));
    renderStories();
  }
  renderPoster();
  setStatus(status);
};
get('import-button').onclick = () => get('import-file').click();
get('import-file').onchange = async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const revision = ++inputRevision;
  try {
    if (!/\.txt$/i.test(file.name) || file.size > 24000) throw Error();
    const text = new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer());
    if (text.length > 6000) throw Error();
    if (revision !== inputRevision) return;
    input.value = text;
    sample = false;
    clearPoster();
    setStatus('imported');
  } catch { if (revision === inputRevision) setStatus('fileError'); }
};
get('download').onclick = () => {
  if (!renderedDate) return;
  const name = 'daily-news-' + renderedDate + '-' + language + '.png';
  canvas.toBlob(blob => {
    if (!blob) { setStatus('downloadError'); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setStatus('ready');
  }, 'image/png');
};

refreshLanguage();
renderPoster();
