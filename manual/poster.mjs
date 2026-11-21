function splitLines(ctx, text, width, maxLines, locale) {
  const segments = [...new Intl.Segmenter(locale, {granularity:'word'}).segment(text)].map(part=>part.segment);
  const lines = [];
  let line = '';
  for (const word of segments) {
    if (line && ctx.measureText(line+word).width > width) {
      lines.push(line.trim());
      line='';
    }
    if (ctx.measureText(word).width > width) {
      for (const character of Array.from(word)) {
        if (ctx.measureText(line+character).width > width) {
          lines.push(line.trim());
          line='';
        }
        line+=character;
      }
    } else line+=line ? word : word.trimStart();
  }
  if (line.trim()) lines.push(line.trim());
  if (lines.length>maxLines) {
    const last = Array.from(lines[maxLines-1]);
    while (ctx.measureText(last.join('')+'…').width>width) last.pop();
    return [...lines.slice(0,maxLines-1),last.join('')+'…'];
  }
  return lines;
}
export function drawPoster(canvas, {date, title, source, stories, language}) {
  const ctx = canvas.getContext('2d');
  const font = 'system-ui, "Microsoft YaHei", sans-serif';
  const fill = (color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const text = (value,color,size,weight,x,y)=>{ctx.fillStyle=color;ctx.font=weight+' '+size+'px '+font;ctx.fillText(value,x,y);};
  const width=1200, height=1440;
  fill('#f5f1e8',0,0,width,height);
  fill('#223a31',0,0,width,220);
  text(title,'#fdfaf0',70,760,62,109);
  text(date,'#ead9ae',35,550,64,177);
  const selected=stories.slice(0,6);
  const rowHeight=(height-337)/selected.length;
  selected.forEach((story,index)=>{
    const y=262+index*rowHeight;
    text(String(index+1).padStart(2,'0'),'#a04032',24,760,57,y+38);
    ctx.font='700 35px '+font;
    const lines=splitLines(ctx,story.title,1000,3,language);
    lines.forEach((line,i)=>text(line,'#1f3129',35,700,113,y+38+i*42));
    if (story.from) {
      ctx.font='500 19px '+font;
      text(splitLines(ctx,story.from,990,1,language)[0],'#53645a',19,500,114,y+64+(lines.length-1)*42);
    }
    fill('#c6cdbf',56,y+rowHeight-12,1088,2);
  });
  ctx.font='500 16px '+font;
  for (const [index,line] of splitLines(ctx,source,1090,2,language).entries()) text(line,'#53645a',16,500,56,1390+index*19);
}
