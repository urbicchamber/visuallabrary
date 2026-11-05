(()=>{
 'use strict';
 const items=window.READING_MATERIALS||[];
 const $=id=>document.getElementById(id);
 const storageKey='library-reading-favorites-v1';
 const topics=['Все','Информация','Память','Травма','Дизайн','Интерфейсы','Типографика','Медиа','Искусство','Кибернетика','Философия','Литература','Хоррор'];
 let topic='Все',language='',access='',query='',onlyFavorites=false,ordered=[...items];
 let favorites=new Set();
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))favorites=new Set(saved.filter(id=>items.some(item=>item.id===id)));}catch{}
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','icon');svg.setAttribute('aria-hidden','true');const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href','#i-'+name);svg.append(use);return svg;};
 const link=(url,className,text)=>{const node=el('a',className,text);node.href=url;node.target='_blank';node.rel='noopener noreferrer';return node;};
 const matchesTopic=(item,name)=>name==='Все'||item.topics.includes(name);
 function readLocation(){
  const params=new URLSearchParams(location.search);
  topic=topics.includes(params.get('topic'))?params.get('topic'):'Все';
  language=['ru','en'].includes(params.get('lang'))?params.get('lang'):'';
  access=['Полный текст','Фрагмент'].includes(params.get('access'))?params.get('access'):'';
  query=params.get('q')||'';onlyFavorites=params.get('saved')==='1';
  $('reading-search').value=query;$('reading-language').value=language;$('reading-access').value=access;
 }
 function updateLocation(){
  const params=new URLSearchParams();
  if(topic!=='Все')params.set('topic',topic);if(language)params.set('lang',language);if(access)params.set('access',access);if(query.trim())params.set('q',query.trim());if(onlyFavorites)params.set('saved','1');
  history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash);
 }
 function renderTopics(){
  $('reading-topics').replaceChildren();
  topics.filter(name=>items.some(item=>matchesTopic(item,name))).forEach(name=>{
   const button=el('button','category',name);button.type='button';button.setAttribute('aria-pressed',String(name===topic));button.append(el('span','category-count',items.filter(item=>matchesTopic(item,name)).length));
   button.addEventListener('click',()=>{topic=name;renderTopics();render();});$('reading-topics').append(button);
  });
 }
 function updateFavoriteUI(){
  $('favorite-count').textContent=favorites.size;$('favorites-filter').setAttribute('aria-pressed',String(onlyFavorites));
  document.querySelectorAll('[data-reading-save]').forEach(button=>{const saved=favorites.has(button.dataset.readingSave);button.setAttribute('aria-pressed',String(saved));button.setAttribute('aria-label',saved?'Убрать текст из избранного':'Добавить текст в избранное');});
 }
 function toggleFavorite(id){
  favorites.has(id)?favorites.delete(id):favorites.add(id);
  try{localStorage.setItem(storageKey,JSON.stringify([...favorites]));}catch{}
  if(onlyFavorites)render();else updateFavoriteUI();
 }
 function card(item,index){
  const article=el('article','reading-card');article.id=item.id;article.dataset.readingId=item.id;
  const media=el('div','reading-media');
  const imageLink=link(item.url,'reading-image-link'+(item.imageHeight>item.imageWidth*1.2?' reading-portrait':''));imageLink.setAttribute('aria-label','Читать: '+item.title);
  const image=el('img');image.src=item.image;image.alt=item.imageAlt||item.imageCredit;image.width=item.imageWidth;image.height=item.imageHeight;image.loading=index<6?'eager':'lazy';image.decoding='async';imageLink.append(image);
  const save=el('button','pin-save');save.type='button';save.dataset.readingSave=item.id;save.append(icon('star'));save.addEventListener('click',()=>toggleFavorite(item.id));media.append(imageLink,save);
  const body=el('div','reading-card-body');
  const metadata=el('div','reading-meta');metadata.append(el('span','',item.language==='ru'?'RU':'EN'),el('span','',item.format));if(item.year)metadata.append(el('span','',item.year));if(/\.pdf(?:$|[?#])/i.test(item.url))metadata.append(el('span','','PDF'));if(item.access==='Фрагмент')metadata.append(el('span','reading-excerpt','Фрагмент'));
  const author=el('p','reading-author',item.author);
  const title=el('h2','reading-title');title.append(link(item.url,'',item.title));
  const description=el('p','reading-description',item.description);
  const quote=el('blockquote','reading-quote');quote.cite=item.url;quote.append(el('p','',item.quote));
  body.append(metadata,author,title,description,quote);
  if(item.quoteTranslation){const original=el('details','reading-original');original.append(el('summary','','Перевод с английского · оригинал'));const text=el('p','',item.quoteOriginal);text.lang='en';original.append(text);body.append(original);}
  const tags=el('div','reading-tags');item.topics.forEach(name=>{const button=el('button','',name);button.type='button';button.addEventListener('click',()=>{topic=name;renderTopics();render();window.scrollTo({top:0,behavior:'instant'});});tags.append(button);});body.append(tags);
  const bottom=el('div','reading-card-bottom');
  const read=link(item.url,'reading-link',item.access==='Фрагмент'?'Читать фрагмент':'Читать');read.append(icon('external'));bottom.append(read,el('span','reading-source',item.sourceTitle));body.append(bottom);
  const credit=el('div','reading-image-credit');credit.append(link(item.imageSource,'',item.imageCredit));
  article.append(media,credit,body);return article;
 }
 function render(){
  const needle=query.trim().toLocaleLowerCase('ru');
  const visible=ordered.filter(item=>matchesTopic(item,topic)&&(!language||item.language===language)&&(!access||item.access===access)&&(!onlyFavorites||favorites.has(item.id))&&(!needle||[item.author,item.title,item.description,item.quote,item.year,...item.topics].join(' ').toLocaleLowerCase('ru').includes(needle)));
  const fragment=document.createDocumentFragment();visible.forEach((item,index)=>fragment.append(card(item,index)));$('reading-grid').replaceChildren(fragment);
  $('reading-count').textContent=visible.length+' / '+items.length;
  $('reading-empty').hidden=visible.length>0;$('reading-empty-label').textContent=onlyFavorites&&favorites.size===0?'Здесь появятся сохранённые тексты':'Ничего не найдено';
  $('reading-reset').hidden=topic==='Все'&&!language&&!access&&!query.trim()&&!onlyFavorites;updateFavoriteUI();updateLocation();
 }
 function reset(){topic='Все';language='';access='';query='';onlyFavorites=false;$('reading-search').value='';$('reading-language').value='';$('reading-access').value='';renderTopics();render();}
 $('reading-search').addEventListener('input',event=>{query=event.target.value;render();});
 $('reading-language').addEventListener('change',event=>{language=event.target.value;render();});
 $('reading-access').addEventListener('change',event=>{access=event.target.value;render();});
 $('favorites-filter').addEventListener('click',()=>{onlyFavorites=!onlyFavorites;render();});
 $('reading-reset').addEventListener('click',reset);$('reading-empty-reset').addEventListener('click',reset);
 $('reading-shuffle').addEventListener('click',()=>{for(let i=ordered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}render();});
 window.addEventListener('popstate',()=>{readLocation();renderTopics();render();});
 $('collection-total').textContent=items.length+' текстов';readLocation();renderTopics();render();
})();
