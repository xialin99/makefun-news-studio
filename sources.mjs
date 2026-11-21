const months = new Intl.DateTimeFormat('en', {month:'long', timeZone:'UTC'});
export function stableDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
}
export function localDate(now = new Date()) {
  const parts = [now.getFullYear(), now.getMonth()+1, now.getDate()];
  return parts.map((n,i)=>String(n).padStart(i===0?4:2,'0')).join('-');
}
export function safeLink(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
function parseHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}
function entries(group, domain, documentFragment) {
  const items = [];
  for (const row of group) {
    if (row.querySelector('li')) continue;
    const citations = [...row.querySelectorAll('.reference a[href^="#"]')].flatMap(anchor => {
      const id = anchor.getAttribute('href').slice(1);
      const note = documentFragment.getElementById(id);
      return note ? [...note.querySelectorAll('a.external')] : [];
    });
    const links = [...row.querySelectorAll('a.external'), ...citations];
    const source = links.map(link => {
      const href = link.getAttribute('href') ?? '';
      return safeLink(href.startsWith('//') ? 'https:' + href : href);
    }).find(url => {
      if (!url) return false;
      const host = new URL(url).hostname;
      return host !== 'wikipedia.org' && !host.endsWith('.wikipedia.org');
    });
    const copy = row.cloneNode(true);
    copy.querySelectorAll('a.external, sup, .reference, .mw-editsection').forEach(node=>node.remove());
    const title = copy.textContent.replace(/\s+/g, ' ').trim();
    if (title.length >= 12 && !items.some(item=>item.title===title)) {
      items.push({title, url:source ?? '', from:source ? new URL(source).hostname.replace(/^www\./,'') : domain});
    }
    if (items.length===12) break;
  }
  return items;
}
export function parseWiki(html, language, date, monthly = false) {
  const dom = parseHTML(html);
  if (language==='en') {
    let day = dom;
    if (monthly) {
      const id = date.getUTCFullYear()+'_'+months.format(date)+'_'+date.getUTCDate();
      day = dom.getElementById(id);
      if (!day) return [];
    }
    const body = day.querySelector('.description, .current-events-content');
    if (monthly && !body) return [];
    return entries((body ?? dom.querySelector('.mw-parser-output') ?? dom).querySelectorAll('li'), 'Wikipedia', dom);
  }
  const headings = [...dom.querySelectorAll('h2, h3, h4')];
  const day = (date.getUTCMonth()+1)+'月'+date.getUTCDate()+'日';
  const target = headings.find(h => h.textContent.trim().startsWith(day));
  if (!target) return [];
  let section = target.closest('.mw-heading') ?? target;
  const found = [];
  let next = section.nextElementSibling;
  while (next && !next.matches('h2,h3,h4,.mw-heading')) {
    found.push(...next.querySelectorAll('li'));
    next = next.nextElementSibling;
  }
  return entries(found, 'Wikipedia', dom);
}
export async function wikiNews(value, language, signal) {
  const date = stableDate(value), month = date.getUTCMonth()+1, day=date.getUTCDate(), year=date.getUTCFullYear();
  const title = language==='zh' ? year+'年'+month+'月' : 'Portal:Current events/'+year+' '+months.format(date)+' '+day;
  const host = 'https://'+language+'.wikipedia.org';
  const page = new URL('/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),host);
  if (language==='zh') page.hash=month+'月'+day+'日';
  const params = new URLSearchParams({action:'parse', page:title, prop:'text', format:'json', formatversion:'2', origin:'*'});
  if (language==='zh') params.set('variant','zh-hans');
  const response = await fetch(host+'/w/api.php?'+params, {signal});
  if (!response.ok) throw new Error('HTTP '+response.status);
  const data = await response.json();
  if (data.error?.code==='missingtitle') return {items:[], page:page.href, language};
  if (typeof data.parse?.text!=='string') throw new Error('No article content');
  return {items:parseWiki(data.parse.text,language,date), page:page.href, language};
}

function utcStamp(date) {return date.toISOString().slice(0,19).replace(/[^0-9]/g,'');}
function dateRange(value) {
  const [year,month,day]=value.split('-').map(Number);
  return [new Date(year,month-1,day),new Date(year,month-1,day+1)];
}
export async function indexedNews(value, language, signal) {
  const [start,end]=dateRange(value);
  const query='(government OR economy OR science OR sports OR health) sourcelang:'+(language==='zh'?'Chinese':'English');
  const params=new URLSearchParams({query, mode:'artlist', format:'json', maxrecords:'20', sort:'hybridrel', startdatetime:utcStamp(start)});
  if(end<=new Date())params.set('enddatetime',utcStamp(end));
  const response=await fetch('https://api.gdeltproject.org/api/v2/doc/doc?'+params,{signal});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();
  return {items:indexedEntries(data.articles??[],start,end),language,page:''};
}
function indexedEntries(articles,start,end) {
  const results=new Map();
  for(const item of articles) {
    const url=safeLink(item.url), raw=item.seendate ?? '';
    const timestamp=raw.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z');
    const seen=Date.parse(timestamp);
    const title=typeof item.title==='string'?item.title.trim():'';
    if(url && title && seen>=start.getTime() && seen<end.getTime() && !results.has(title))results.set(title,{url,title,from:new URL(url).hostname.replace(/^www\./,'')});
  }
  return [...results.values()].slice(0,12);
}
export async function cachedNews(value, language, signal) {
  const [start,end]=dateRange(value);
  const days=[...new Set([start,new Date(end-1)].map(date=>date.toISOString().slice(0,10)))];
  const path='https://api.github.com/repos/xialin99/makefun-news-studio/contents/data/';
  const read=async day=>{
    const file=path+day+'.'+language+'.json?ref=news-cache';
    const response=await fetch(file,{signal,headers:{Accept:'application/vnd.github.raw+json'}});
    if(response.status===404)return [];
    if(!response.ok)throw new Error('HTTP '+response.status);
    const rows=await response.json();
    return Array.isArray(rows)?rows:[];
  };
  const pages=await Promise.allSettled(days.map(read));
  const articles=pages.flatMap(page=>page.status==='fulfilled'?page.value:[]);
  return {items:indexedEntries(articles,start,end),language,page:''};
}
