import {landownerNotices,NOTICES_KEY} from './landowner-store.js';
import {getCurrentUser} from './auth.js';
import {noticeKey,unreadNotices,readNoticeKeys} from './notification-state.js';

// Example messages from landowners for the prototype.
const initialNotices = [
 {id:'closure',title:'Alt laksefiske er stengt',sender:'Grunneier · Alle soner',text:'Etter vedtak fra myndighetene er alt laksefiske i elva stengt med umiddelbar virkning. Stengingen gjelder alle soner inntil videre. Du får et nytt varsel når fisket åpner igjen.'},
];

const trigger=document.querySelector('button[aria-label="Varsler"]');
async function initializeNotifications(trigger){
 let notices=[...landownerNotices(),...initialNotices];
 const user=await getCurrentUser();
 const readKey=`easyfisk.notifications.read:${user?.email?.toLowerCase()||'guest'}`;
 const dot=document.createElement('span');dot.className='notification-dot';dot.setAttribute('aria-hidden','true');trigger.classList.add('notification-trigger');trigger.append(dot);
 let read=[];
 function refreshUnread(){
  try{read=readNoticeKeys(localStorage,readKey);}catch{ /* Keep in-memory read state when storage is unavailable. */ }
  const count=unreadNotices(notices,read).length;
  dot.hidden=count===0;
  trigger.setAttribute('aria-description',count?`${count} uleste varsler`:'Ingen uleste varsler');
 }
 refreshUnread();
 window.addEventListener('storage',event=>{if(event.key===NOTICES_KEY||event.key===null)updateNotices();else if(event.key===readKey)refreshUnread();});
 window.addEventListener('easyfisk:notices-changed',updateNotices);
 window.addEventListener('pageshow',refreshUnread);
 const dialog=document.createElement('dialog');dialog.className='message-dialog';dialog.setAttribute('aria-labelledby','notifications-heading');
 const heading=document.createElement('h2');heading.id='notifications-heading';heading.textContent='Varsler fra grunneiere';
 const status=document.createElement('p');status.className='account-status';status.textContent='Viktig informasjon om fisket i dine soner.';
 const list=document.createElement('div');
 function renderNotices(){
 list.replaceChildren();
 for(const notice of notices){
  const item=document.createElement('article');item.className='notification-item';
  const sender=document.createElement('p');sender.className='account-status';sender.textContent=notice.sender;
  const title=document.createElement('h3');title.textContent=notice.title;
  const text=document.createElement('p');text.textContent=notice.text;
  item.append(sender,title,text);list.append(item);
 }
 }
 function updateNotices(){notices=[...landownerNotices(),...initialNotices];renderNotices();refreshUnread();}
 renderNotices();
 const close=document.createElement('button');close.type='button';close.className='account-button dialog-cancel';close.textContent='Lukk';close.addEventListener('click',()=>dialog.close());
 dialog.append(heading,status,list,close);document.body.append(dialog);
 trigger.addEventListener('click',()=>{
  updateNotices();
  if(!dialog.open)dialog.showModal();
  read=[...new Set([...read,...notices.map(noticeKey)])];
  try{localStorage.setItem(readKey,JSON.stringify(read));}catch{ /* The current page still marks these notifications as read. */ }
  dot.hidden=true;trigger.setAttribute('aria-description','Ingen uleste varsler');
 });
}

if(trigger)initializeNotifications(trigger);
