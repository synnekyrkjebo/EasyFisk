import {loginUser,getCurrentUser,getLandownerAccounts} from '../shared/auth.js';

const form=document.querySelector('#owner-login-form');
const button=document.querySelector('#owner-login-submit');
const status=document.querySelector('#owner-login-status');
const dashboard=new URL('grunneier.html',location.href);
const accountSelect=document.querySelector('#owner-login-account');
const accounts=getLandownerAccounts();
for(const account of accounts){const option=document.createElement('option');option.value=account.accountId;option.textContent=account.managedPlaces[0];accountSelect.append(option);}
function showAccount(){
 const account=accounts.find(account=>account.accountId===accountSelect.value)||accounts[0];
 document.querySelector('#owner-login-place').textContent=account.managedPlaces[0];document.querySelector('#owner-login-email').textContent=account.email;
}
accountSelect.addEventListener('change',showAccount);showAccount();
getCurrentUser().then(user=>{
 if(user?.role==='landowner'){
  if(new URLSearchParams(location.search).get('bytt')!=='1')location.replace(dashboard.href);
  else{accountSelect.value=user.accountId;showAccount();}
 }
});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(button.disabled)return;
 button.disabled=true;button.textContent='Logger inn …';status.textContent='';
 try{
  await loginUser('landowner',accountSelect.value);
  const user=await getCurrentUser();
  if(user?.role!=='landowner')throw new Error('Grunneierinnloggingen kunne ikke lagres. Tillat nettstedsdata og prøv igjen.');
  location.assign(dashboard.href);
 }
 catch(error){status.textContent=error.message||'Kunne ikke logge inn. Prøv igjen.';button.disabled=false;button.textContent='Logg inn på grunneierportalen';}
});
