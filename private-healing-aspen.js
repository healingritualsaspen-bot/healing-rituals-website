const clarityForm=document.querySelector('#clarityForm');
const preference=document.querySelector('#contactPreference');
const email=document.querySelector('#leadEmail');

function updateEmailRequirement(){
  const emailChosen=preference.value==='Email';
  email.required=emailChosen;
  email.setAttribute('aria-required',String(emailChosen));
}

preference.addEventListener('change',updateEmailRequirement);
updateEmailRequirement();

clarityForm.addEventListener('submit',event=>{
  updateEmailRequirement();
  if(!clarityForm.checkValidity()){
    event.preventDefault();
    clarityForm.reportValidity();
  }
});

const campaignParameters=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid'];
const currentParameters=new URLSearchParams(location.search);
campaignParameters.forEach(parameter=>{
  const value=currentParameters.get(parameter);
  if(!value)return;
  const field=document.createElement('input');
  field.type='hidden';
  field.name=`Campaign ${parameter}`;
  field.value=value;
  clarityForm.append(field);
});

const landingField=document.createElement('input');
landingField.type='hidden';
landingField.name='Landing page';
landingField.value=location.href;
clarityForm.append(landingField);
