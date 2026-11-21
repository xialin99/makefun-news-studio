import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { safeLink } from '../sources.mjs';

const directory=process.argv[2];
if(!directory)throw new Error('Provide the data directory');
await mkdir(directory,{recursive:true});
let saved=0;
for(const [locale, language] of [['zh','Chinese'],['en','English']]){
  const params=new URLSearchParams({query:'(government OR economy OR science OR sports OR health) sourcelang:'+language,
    mode:'artlist',format:'json',maxrecords:'160',sort:'hybridrel',timespan:'48h'});
  try{
    const response=await fetch('https://api.gdeltproject.org/api/v2/doc/doc?'+params,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json(), days=new Map();
    for(const item of data.articles ?? []){
      const url=safeLink(item.url), stamp=String(item.seendate??'');
      if(!url||typeof item.title!=='string'||!item.title.trim()||!/^\d{8}T\d{6}Z$/.test(stamp))continue;
      const day=stamp.replace(/^(\d{4})(\d{2})(\d{2}).*$/,'$1-$2-$3');
      if(!days.has(day))days.set(day,[]);
      days.get(day).push({url,title:item.title.trim(),seendate:stamp});
    }
    for(const [day,items] of days){
      const file=join(directory,day+'.'+locale+'.json');
      const previous=await readFile(file,'utf8').then(JSON.parse).catch(()=>[]);
      const unique=new Map([...previous,...items].map(story=>[story.url,story]));
      const articles=[...unique.values()].sort((a,b)=>b.seendate.localeCompare(a.seendate)).slice(0,160);
      await writeFile(file,JSON.stringify(articles)+'\n');
      saved+=articles.length;
    }
    console.log(locale,days.size,'UTC dates');
  }catch(error){ console.error(locale,error.message); }
  if(locale==='zh')await wait(6500);
}
if(!saved)throw new Error('The news index returned no cacheable articles');
