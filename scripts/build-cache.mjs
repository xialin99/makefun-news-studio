import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { safeLink } from '../sources.mjs';

const directory=process.argv[2];
if(!directory)throw new Error('Provide the data directory');
await mkdir(directory,{recursive:true});

const feed='https://data.gdeltproject.org/gdeltv3/gal/feed.rss';
const response=await fetch(feed,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error('GDELT Article List HTTP '+response.status);
const source=await response.text();
const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
const decode=xml=>xml.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/,'$1')
  .replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi,(original,entity)=>{
    if(Object.hasOwn(named,entity))return named[entity];
    const number=entity.startsWith('#x')?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);
    return Number.isInteger(number)&&number>0&&number<=0x10ffff?String.fromCodePoint(number):original;
  });
function field(xml, name) {
  const match=new RegExp('<'+name+'>([\\s\\S]*?)</'+name+'>').exec(xml);
  return match?decode(match[1]).replace(/\s+/g,' ').trim():'';
}
const files=new Map();
for(const item of source.matchAll(/<item>([\s\S]*?)<\/item>/g)){
  const [,xml]=item;
  const url=safeLink(field(xml,'link')), title=field(xml,'title');
  const date=new Date(field(xml,'pubDate'));
  if(!url||!title||Number.isNaN(date.valueOf()))continue;
  const script=Array.from(title.matchAll(/\p{Script=Han}/gu)).length;
  const zh=script>=8&&!/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(title);
  const en=title.length>=26&&/^[\p{Script=Latin}\p{Script=Common}]+$/u.test(title)&&/\b(the|to|of|for|in|and|with|after|from|on|by|is|as)\b/i.test(title);
  const locale=zh?'zh':en?'en':'';
  if(!locale)continue;
  const iso=date.toISOString();
  const key=iso.slice(0,10)+'.'+locale+'.json';
  if(!files.has(key))files.set(key,[]);
  files.get(key).push({url,title,seendate:iso.slice(0,19).replace(/[-:]/g,'')+'Z'});
}
for(const [name,stories] of files){
  const file=join(directory,name);
  const previous=await readFile(file,'utf8').then(JSON.parse).catch(()=>[]);
  const unique=new Map([...previous,...stories].map(item=>[item.url,item]));
  const byOutlet=new Map();
  const articles=[...unique.values()].sort((a,b)=>b.seendate.localeCompare(a.seendate)).filter(story=>{
    const outlet=new URL(story.url).hostname.replace(/^www\./,'');
    const count=byOutlet.get(outlet)??0;
    if(count>=4)return false;
    byOutlet.set(outlet,count+1);return true;
  }).slice(0,180);
  await writeFile(file,JSON.stringify(articles)+'\n');
  console.log(name,articles.length);
}
if(!files.size)throw new Error('The news feed returned no cacheable articles');
