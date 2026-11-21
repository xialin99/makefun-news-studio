import {samples} from './samples.mjs';
import {localDate, safeLink, stableDate, wikiNews, indexedNews, cachedNews} from './sources.mjs';
import {drawPoster} from './poster.mjs';

const copy={
 zh:{brand:'每日新闻制图',language:'界面语言',heading:'把一天的新闻做成一张图',intro:'选日期载入报道，挑选想保留的条目，再下载 PNG。',controls:'选日期和新闻',date:'新闻日期',today:'今天',load:'加载新闻',examples:'离线样例',manualVersion:'手动版',manual:'手动录入新闻',manualHint:'每行一条标题。可在标题后加竖线和报道链接。',paste:'新闻标题',placeholder:'新闻标题 | https://example.com/story',add:'使用这些新闻',preview:'新闻图预览',download:'下载 PNG',empty:'选好新闻后，预览会出现在这里。',loading:'正在查找当天的新闻…',invalid:'请选择今天或更早的有效日期。',none:'这个日期暂时没有查到报道。可以换个日期、查看离线样例，或手动录入。',offline:'新闻来源暂时无法连接。可以用下方样例确认工具可用，或手动录入当天的标题。',manualEmpty:'请至少输入一条新闻标题。',sample:'历史参赛样例',source:'查看报道',archive:'维基百科新闻档案',indexed:'GDELT 新闻索引',cached:'GDELT 新闻索引缓存',manualSource:'用户录入',foreign:'找到了英文资料，新闻正文保留原文。',picked:'已选',count:'条',max:'最多选择 6 条新闻。',export:'已生成 PNG。',exportError:'未能生成 PNG，请重试。',list:'新闻列表',todaySource:'索引按报道收录时间筛选。',changeDate:'日期已变更，点击「加载新闻」继续。'},
 en:{brand:'Daily News Studio',language:'Interface language',heading:'Make a news poster for any day',intro:'Choose a date, select the stories to include, and download a PNG.',controls:'Date and stories',date:'News date',today:'Today',load:'Load news',examples:'Offline examples',manualVersion:'Manual version',manual:'Enter your own stories',manualHint:'Add one headline per line. You can add a pipe and a link after the title.',paste:'Headlines',placeholder:'Headline | https://example.com/story',add:'Use these stories',preview:'Poster preview',download:'Download PNG',empty:'Select stories to see a preview here.',loading:'Looking up news for this date…',invalid:'Select a valid date on or before today.',none:'No stories were found for this date. Try another date, use an offline example, or enter stories manually.',offline:'The news sources are unreachable right now. Try an offline example or enter headlines for this date.',manualEmpty:'Enter at least one headline.',sample:'Archived competition example',source:'Read the story',archive:'Wikipedia current events archive',indexed:'GDELT news index',cached:'Cached GDELT news index',manualSource:'User-entered news',foreign:'These source headlines are available in English.',picked:'Selected',count:'stories',max:'Select up to 6 stories.',export:'PNG created.',exportError:'Could not create the PNG. Please try again.',list:'Stories',todaySource:'The index uses the time each story was collected.',changeDate:'Date changed. Select “Load news” to continue.'}
};
const get=id=>document.getElementById(id);
let language='zh';
try {if(localStorage.getItem('daily-news-language')==='en') language='en';} catch {}
const translate=key=>copy[language][key];
const dateInput=get('date');
let activeDate='', stories=[], selected=new Set(), provider='', sourcePage='', sourceLanguage='', statusKey='', request;
const cache=new Map();
function setStatus(key){
  statusKey=key;
  get('status').textContent=key ? translate(key) : stories.length ?
    [translate(provider),sourceLanguage && sourceLanguage!==language ? translate('foreign') : '',(provider==='indexed'||provider==='cached')?translate('todaySource'):'',translate('picked')+' '+selected.size+' / 6 '+translate('count')].filter(Boolean).join(' · ') : '';
}
function formatDate(value){
  return new Intl.DateTimeFormat(language==='zh'?'zh-CN':'en',{dateStyle:'full',timeZone:'UTC'}).format(stableDate(value));
}
function refreshCopy(){
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.title=translate('brand');
  get('language').value=language;
  for(const el of document.querySelectorAll('[data-copy]')) el.textContent=translate(el.dataset.copy);
  get('paste').placeholder=translate('placeholder');
  get('stories').setAttribute('aria-label',translate('list'));
  get('poster').setAttribute('aria-label',translate('preview'));
}
function render(updateStories=true){
  if(updateStories){
    get('stories').replaceChildren(...stories.map((story,index)=>{
      const li=document.createElement('li');
      const input=document.createElement('input');
      input.type='checkbox';input.id='story-'+index;input.checked=selected.has(index);
      input.addEventListener('change',()=>{
        if(input.checked && selected.size===6){input.checked=false;setStatus('max');return;}
        if(input.checked) selected.add(index); else selected.delete(index);
        render(false);setStatus('');
      });
      const label=document.createElement('label');
      label.htmlFor=input.id;label.textContent=story.title;
      li.append(input,label);
      if(story.url){
        const link=document.createElement('a');
        link.href=story.url;link.textContent=(story.from||translate('source'))+' ↗';link.target='_blank';link.rel='noopener noreferrer';
        li.append(link);
      }
      return li;
    }));
  }
  const included=stories.filter((_,index)=>selected.has(index));
  const canvas=get('poster'), hasNews=Boolean(included.length);
  canvas.hidden=!hasNews;get('empty').hidden=hasNews;get('download').disabled=!hasNews;
  get('attribution').hidden=provider!=='archive';
  get('gdelt-credit').hidden=!['indexed','cached'].includes(provider);
  if(provider==='archive'){
    get('source-page').href=sourcePage;
    get('source-page').textContent=translate('archive');
  }
  if(!hasNews)return;
  const citation=translate(provider)+(provider==='archive'?' · CC BY-SA 4.0 · '+sourcePage:['indexed','cached'].includes(provider)?' · The GDELT Project · https://www.gdeltproject.org/':'');
  drawPoster(canvas,{date:formatDate(activeDate),title:translate('brand'),source:citation,stories:included,language});
}
function setStories(items, date, origin, url='', originalLanguage=''){
  activeDate=date;stories=items;provider=origin;sourcePage=url;sourceLanguage=originalLanguage;
  selected=new Set(items.slice(0,6).map((_,i)=>i));
  if(items.length) get('manual').open=origin==='manualSource';
  render();setStatus('');
}
function sampleStories(date){
  const [texts,url]=samples[date];
  return texts[language].map(title=>({title,url,from:translate('sample')}));
}
async function load(date){
  request?.abort();
  if(!stableDate(date) || date>localDate()){setStories([],date,'');setStatus('invalid');return;}
  dateInput.value=date;
  if(Object.hasOwn(samples,date)){setStories(sampleStories(date),date,'sample');return;}
  const key=date+'|'+language;
  if(cache.has(key)){
    const {items,page,language:origin,provider:originProvider}=cache.get(key);
    setStories(items,date,originProvider,page,origin);
    return;
  }
  const current=new AbortController();
  request=current;setStories([],date,'');setStatus('loading');
  let failed=false;
  const recent=(stableDate(localDate())-stableDate(date))/86400000<85;
  const run=async (loader, originProvider)=>{
    try {
      const timeout=AbortSignal.timeout(8500);
      const result=await loader(AbortSignal.any([current.signal,timeout]));
      return {...result,provider:originProvider};
    }catch{failed=true;return null;}
  };
  const today=date===localDate();
  let result;
  if(today){
    const saved=await run(signal=>cachedNews(date,language,signal),'cached');
    if(saved?.items.length)result=saved;
  }
  if(!result&&!current.signal.aborted){
    const first=await Promise.all([
      run(signal=>wikiNews(date,language,signal),'archive'),
      recent&&today ? run(signal=>indexedNews(date,language,signal),'indexed') : null
    ]);
    result=first.find(item=>item?.items.length);
  }
  if(!result && !today && !current.signal.aborted){
    const saved=await run(signal=>cachedNews(date,language,signal),'cached');
    if(saved?.items.length)result=saved;
  }
  if(!result && !current.signal.aborted && language==='zh'){
    const fallback=await run(signal=>wikiNews(date,'en',signal),'archive');
    if(fallback?.items.length)result=fallback;
  }
  if(!result && !current.signal.aborted && recent&&!today){
    const fallback=await run(signal=>indexedNews(date,language,signal),'indexed');
    if(fallback?.items.length)result=fallback;
  }
  if(current.signal.aborted) return;
  if(result){
    cache.set(key,result);
    setStories(result.items,date,result.provider,result.page,result.language);
  }else{setStatus(failed?'offline':'none');get('manual').open=true;}
}
dateInput.max=localDate();
dateInput.value=Object.hasOwn(samples,new URLSearchParams(location.search).get('date'))?new URLSearchParams(location.search).get('date'):localDate();
dateInput.addEventListener('change',()=>{
  request?.abort();setStories([],dateInput.value,'');setStatus('changeDate');
});
get('date-form').addEventListener('submit',event=>{event.preventDefault();load(dateInput.value);});
get('today').onclick=()=>{dateInput.max=localDate();load(localDate());};
for(const button of document.querySelectorAll('[data-date]')) button.onclick=()=>load(button.dataset.date);
get('language').onchange=event=>{
  language=event.target.value;
  try {localStorage.setItem('daily-news-language',language);} catch {}
  refreshCopy();
  if(provider==='sample'){
    const choices=selected;stories=sampleStories(activeDate);selected=choices;render();setStatus(statusKey);
  }else if(provider==='manualSource'){render();setStatus(statusKey);}
  else load(dateInput.value);
};
get('paste-button').onclick=()=>{
  const date=dateInput.value;
  if(!stableDate(date) || date>localDate()){setStatus('invalid');return;}
  const manual=get('paste').value.split(/\r?\n/).map(line=>{
    const [title,url]=line.split(/\s+\|\s+/,2);
    const safe=safeLink(url?.trim() ?? '');
    return {title:title.trim(),url:safe,from:safe?new URL(safe).hostname:''};
  }).filter(item=>item.title).slice(0,12);
  if(!manual.length){setStatus('manualEmpty');return;}
  request?.abort();setStories(manual,date,'manualSource');
};
get('download').onclick=()=>{
  const filename='daily-news-'+activeDate+'-'+language+'.png';
  get('poster').toBlob(blob=>{
    if(!blob){setStatus('exportError');return;}
    const link=document.createElement('a');
    const url=URL.createObjectURL(blob);
    link.href=url;link.download=filename;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);setStatus('export');
  },'image/png');
};
refreshCopy();
load(dateInput.value);
