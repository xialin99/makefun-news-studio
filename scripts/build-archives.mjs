import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { parseWiki } from '../sources.mjs';

const [destination,countText,parserFile]=process.argv.slice(2);
const count=Number(countText);
if(!destination||!parserFile||!Number.isInteger(count)||count<1||count>24)throw new Error('Invalid archive build arguments');
const {parseHTML}=await import(pathToFileURL(parserFile));
globalThis.document=parseHTML('<!doctype html><html><body></body></html>').document;
await mkdir(destination,{recursive:true});
const monthName=new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'});
const now=new Date();
let written=0;
for(let offset=0;offset<count;offset++){
  const first=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-offset,1));
  const month=first.toISOString().slice(0,7);
  const year=first.getUTCFullYear(), number=first.getUTCMonth()+1;
  for(const language of ['en', 'zh']){
    const title=language==='zh'? year+'年'+number+'月':'Portal:Current events/'+monthName.format(first)+' '+year;
    const host='https://'+language+'.wikipedia.org';
    const params=new URLSearchParams({action:'parse',page:title,prop:'text',format:'json',formatversion:'2',origin:'*'});
    if(language==='zh')params.set('variant','zh-hans');
    try{
      const response=await fetch(host+'/w/api.php?'+params,{signal:AbortSignal.timeout(16000),headers:{'User-Agent':'Daily News Studio archive index (https://github.com/xialin99/makefun-news-studio)'}});
      if(response.status===429){console.log('Archive provider asked to slow down',language,month);await wait(6500);continue;}
      if(!response.ok)throw new Error('HTTP '+response.status);
      const {parse}=await response.json();
      if(typeof parse?.text!=='string')continue;
      const total=new Date(Date.UTC(year,number,0)).getUTCDate();
      const days={};
      for(let day=1;day<=total;day++){
        const date=new Date(Date.UTC(year,number-1,day));
        const items=parseWiki(parse.text,language,date,true).slice(0,6).map(item=>{
          const chars=Array.from(item.title);
          return {...item,title:chars.length>240?chars.slice(0,239).join('')+'…':item.title};
        });
        if(items.length) days[day]=items;
      }
      if(!Object.keys(days).length)continue;
      const page=new URL('/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),host).href;
      await writeFile(join(destination,month+'.'+language+'.json'),JSON.stringify({language,page,days})+'\n');
      console.log(month,language,Object.keys(days).length);
      written++;
    }catch(error){console.log('Archive unavailable',month,language,error.message);}
    await wait(600);
  }
}
if(!written)throw new Error('No archive data could be loaded');
