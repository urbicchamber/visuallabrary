(()=>{
 'use strict';
 const items=window.REFERENCE_IMAGES||[];
 const $=id=>document.getElementById(id);
 const storageKey='director-reference-favorites-v1';
 const categories=['Все','Раннее digital','Хоррор','Космос','Художники','Иллюстрация','Цифровая живопись','Интерфейсы','Игры','Вёрстка','Коллаж','Музыка','Карты','Наука','Фотография'];
 const matchesCategory=(item,name)=>{
  if(name==='Все')return true;
  if(name==='Космос'||name==='Хоррор')return item.tags.some(tag=>tag.toLocaleLowerCase('ru')===name.toLocaleLowerCase('ru'));
  return item.category===name;
 };
 let favorites=new Set();
 try{favorites=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));}catch{}
 let category='Все',onlyFavorites=false,query='',interfaceType='',ordered=[...items],visible=[],currentIndex=0;
 const interfaceKind=item=>['Программы','Игры','Вымышленные'].find(type=>item.tags.some(tag=>tag.toLocaleLowerCase('ru')===type.toLocaleLowerCase('ru')))||(/Mu Cartographer|The Silver Case|25th Ward/i.test(item.title)?'Игры':'Программы');
 const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','icon');svg.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-'+name);svg.append(use);return svg;};
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 function setFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem(storageKey,JSON.stringify([...favorites]));}catch{}updateFavoriteUI();if(onlyFavorites&&!$('viewer').open)render();}
 function updateFavoriteUI(){
  $('favorite-count').textContent=favorites.size;
  document.querySelectorAll('[data-save-id]').forEach(button=>{const saved=favorites.has(button.dataset.saveId);button.setAttribute('aria-pressed',String(saved));button.setAttribute('aria-label',saved?'Убрать из избранного':'Добавить в избранное');});
  if($('viewer').open&&visible[currentIndex]){const saved=favorites.has(visible[currentIndex].id);$('viewer-save').setAttribute('aria-pressed',String(saved));$('viewer-save').querySelector('span').textContent=saved?'Сохранено':'В избранное';}
 }
 function renderCategories(){
  $('categories').replaceChildren();
  categories.filter(name=>items.some(i=>matchesCategory(i,name))).forEach(name=>{
   const count=items.filter(i=>matchesCategory(i,name)).length;
   const button=el('button','category',name);button.type='button';button.setAttribute('aria-pressed',String(category===name));button.append(el('span','category-count',count));
   button.addEventListener('click',()=>{category=name;renderCategories();render();});$('categories').append(button);
  });
 }
 function render(){
  const needle=query.trim().toLocaleLowerCase('ru');
  visible=ordered.filter(item=>matchesCategory(item,category)&&(!(category==='Интерфейсы'&&interfaceType)||interfaceKind(item)===interfaceType)&&(!onlyFavorites||favorites.has(item.id))&&(!needle||[item.author,item.title,item.year,item.category,...item.tags].join(' ').toLocaleLowerCase('ru').includes(needle)));
  $('interface-type').hidden=category!=='Интерфейсы';
  const fragment=document.createDocumentFragment();
  visible.forEach((item,index)=>{
   const article=el('article','pin');
   const media=el('div','pin-media');
   const open=el('button','image-open');open.type='button';open.setAttribute('aria-label',item.author+' — '+item.title+', открыть');
   const image=el('img');image.src=item.thumb||item.src;image.alt=item.author+' — '+item.title;image.width=item.width;image.height=item.height;image.loading=index<8?'eager':'lazy';image.decoding='async';
   open.append(image);open.addEventListener('click',()=>openViewer(index));
   const save=el('button','pin-save');save.type='button';save.dataset.saveId=item.id;save.append(icon('star'));save.addEventListener('click',()=>setFavorite(item.id));media.append(open,save);
   const caption=el('div','pin-caption');const description=el('div');description.append(el('h2','pin-author',item.author));const title=el('p','pin-title',item.title);if(item.year){title.append(document.createTextNode(' · '),el('span','pin-year',item.year));}description.append(title);
   const source=el('a','pin-source');source.href=item.source;source.target='_blank';source.rel='noopener noreferrer';source.setAttribute('aria-label','Источник: '+item.author+' — '+item.title);source.title='Источник';source.append(icon('external'));caption.append(description,source);article.append(media,caption);fragment.append(article);
  });
  $('gallery').replaceChildren(fragment);$('empty').hidden=visible.length>0;
  $('empty-label').textContent=onlyFavorites&&favorites.size===0?'Здесь появятся сохранённые изображения':'Ничего не найдено';
  $('results-count').textContent=visible.length+' / '+items.length;
  $('reset').hidden=category==='Все'&&!onlyFavorites&&!needle;
  $('favorites-filter').setAttribute('aria-pressed',String(onlyFavorites));
  updateFavoriteUI();
 }
 function openViewer(index){currentIndex=index;updateViewer();$('viewer').showModal();document.body.classList.add('viewer-open');updateFavoriteUI();}
 function updateViewer(){
  const item=visible[currentIndex];if(!item)return;
  $('viewer-image').src=item.src;$('viewer-image').alt=item.author+' — '+item.title;
  $('viewer-author').textContent=item.author;$('viewer-title').textContent=item.title;
  $('viewer-meta').textContent=[item.year,item.category].filter(Boolean).join(' · ');
  $('viewer-index').textContent=String(currentIndex+1).padStart(2,'0')+' / '+visible.length;
  $('viewer-source').href=item.source;$('viewer-expand').href=item.src;
  $('viewer-tags').replaceChildren();
  item.tags.forEach(tag=>{const button=el('button','',tag);button.type='button';button.addEventListener('click',()=>{$('viewer').close();query=tag;$('search').value=tag;render();window.scrollTo({top:0,behavior:'instant'});});$('viewer-tags').append(button);});
  $('viewer-save').setAttribute('aria-pressed',String(favorites.has(item.id)));$('viewer-save').querySelector('span').textContent=favorites.has(item.id)?'Сохранено':'В избранное';
  const previous=visible[(currentIndex+visible.length-1)%visible.length];const next=visible[(currentIndex+1)%visible.length];for(const nearby of [previous,next]){const preload=new Image();preload.src=nearby.src;}
 }
 function step(delta){currentIndex=(currentIndex+delta+visible.length)%visible.length;updateViewer();}
 function reset(){category='Все';query='';interfaceType='';onlyFavorites=false;$('search').value='';$('interface-type').value='';renderCategories();render();}
 $('interface-type').addEventListener('change',event=>{interfaceType=event.target.value;render();});
 $('search').addEventListener('input',event=>{query=event.target.value;render();});
 $('favorites-filter').addEventListener('click',()=>{onlyFavorites=!onlyFavorites;render();});
 $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
 $('density').addEventListener('click',()=>{const large=$('gallery').classList.toggle('large');$('density').setAttribute('aria-pressed',String(large));$('density').setAttribute('aria-label',large?'Показывать больше изображений':'Показывать изображения крупнее');});
 $('shuffle').addEventListener('click',()=>{for(let i=ordered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}render();});
 $('viewer-close').addEventListener('click',()=>$('viewer').close());
 $('viewer-prev').addEventListener('click',()=>step(-1));$('viewer-next').addEventListener('click',()=>step(1));
 $('viewer-save').addEventListener('click',()=>setFavorite(visible[currentIndex].id));
 $('viewer').addEventListener('close',()=>{document.body.classList.remove('viewer-open');if(onlyFavorites)render();});
 $('viewer').addEventListener('click',event=>{if(event.target===$('viewer')){const r=$('viewer').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('viewer').close();}});
 document.addEventListener('keydown',event=>{if(!$('viewer').open)return;if(event.key==='ArrowRight'){event.preventDefault();step(1);}if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}});
 $('collection-total').textContent=items.length+' изображений';renderCategories();render();
})();
