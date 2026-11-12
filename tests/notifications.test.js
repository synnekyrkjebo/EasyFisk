import test from 'node:test';
import assert from 'node:assert/strict';
import {noticeKey,unreadNotices,readNoticeKeys} from '../scripts/shared/notification-state.js';

test('read notices stay read; new and revised notices are unread',()=>{
 const first={id:'closure',title:'Fiskestans',sender:'Grunneier',text:'Stengt'};
 const read=[noticeKey(first)];
 assert.equal(unreadNotices([first],[]).length,1);
 assert.equal(unreadNotices([first],read).length,0);
 assert.equal(unreadNotices([first,{...first,id:'reopening'}],read).length,1);
 assert.equal(unreadNotices([{...first,text:'Åpent igjen'}],read).length,1);
 assert.equal(unreadNotices([],read).length,0);
});

test('invalid or unavailable read storage falls back to unread',()=>{
 for(const value of ['null','{}','invalid'])assert.deepEqual(readNoticeKeys({getItem:()=>value},'read'),[]);
 assert.deepEqual(readNoticeKeys({getItem:()=>{throw new Error('Unavailable');}},'read'),[]);
 assert.deepEqual(readNoticeKeys({getItem:()=>'["seen",42]'},'read'),['seen']);
});
