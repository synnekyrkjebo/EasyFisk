import test from 'node:test';
import assert from 'node:assert/strict';
import {loginUser,getCurrentUser} from '../scripts/shared/auth.js';

test('portal submit signs in a guest or switches a fisher to the landowner dashboard',async()=>{
 for(const [index,initialRole]of ['guest','fisher'].entries()){
  const values=new Map();
  globalThis.sessionStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  globalThis.localStorage={getItem:()=>null};
  if(initialRole==='fisher')await loginUser();
  let submit,assigned;
  const button={disabled:false,textContent:''},status={textContent:''};
  const account={value:index===0?'a':'b',append(){},addEventListener(){}};
  const form={addEventListener:(type,handler)=>{assert.equal(type,'submit');submit=handler;}};
  globalThis.document={createElement:()=>({}),querySelector:selector=>({'#owner-login-form':form,'#owner-login-submit':button,'#owner-login-status':status,'#owner-login-account':account,'#owner-login-place':{},'#owner-login-email':{}})[selector]};
  globalThis.location={href:'https://easyfisk.test/EasyFisk/grunneier-logginn.html',assign:url=>{assigned=url;},replace:()=>assert.fail('Must not redirect before sign-in')};
  await import(`../scripts/pages/landowner-login.js?test=${index}`);
  let prevented=false;await submit({preventDefault:()=>{prevented=true;}});
  assert.ok(prevented);assert.equal((await getCurrentUser()).role,'landowner');
  assert.deepEqual((await getCurrentUser()).managedPlaces,[index===0?'Holmesland A':'Holmesland B']);
  assert.equal(assigned,'https://easyfisk.test/EasyFisk/grunneier.html');assert.equal(status.textContent,'');
 }
});

test('blocked session storage displays an error and lets the user retry',async()=>{
 globalThis.sessionStorage={getItem:()=>null,setItem:()=>{throw new Error('Blocked');}};
 let submit;
 const button={disabled:false,textContent:''},status={textContent:''};
 globalThis.document={createElement:()=>({}),querySelector:selector=>({'#owner-login-form':{addEventListener:(_,handler)=>{submit=handler;}},'#owner-login-submit':button,'#owner-login-status':status,'#owner-login-account':{value:'a',append(){},addEventListener(){}},'#owner-login-place':{},'#owner-login-email':{}})[selector]};
 globalThis.location={href:'https://easyfisk.test/grunneier-logginn.html',assign:()=>assert.fail('Must not navigate after failed sign-in')};
 await import('../scripts/pages/landowner-login.js?test=blocked');
 await submit({preventDefault(){}});
 assert.match(status.textContent,/Kunne ikke lagre innloggingen/);assert.equal(button.disabled,false);
});
