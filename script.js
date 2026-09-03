const menuButton=document.querySelector('#menuButton');
const mobileMenu=document.querySelector('#mobileMenu');
menuButton.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}));

const reveals=document.querySelectorAll('.reveal');
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.14});
reveals.forEach(el=>observer.observe(el));

const sections=[...document.querySelectorAll('main section[id]')];
const navLinks=[...document.querySelectorAll('.nav-dot')];
function updateScroll(){
  const max=document.documentElement.scrollHeight-innerHeight;
  document.querySelector('#progressBar').style.width=`${max?scrollY/max*100:0}%`;
  let current=sections[0]?.id;
  sections.forEach(section=>{if(scrollY>=section.offsetTop-innerHeight*.44)current=section.id;});
  navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${current}`));
}
addEventListener('scroll',updateScroll,{passive:true});updateScroll();

const ritualForm=document.querySelector('#ritualForm');
if(ritualForm){
  const choices=[...ritualForm.querySelectorAll('.ritual-choice input[type="checkbox"]')];
  const selectedField=document.querySelector('#selectedModalities');
  const selectionCount=document.querySelector('#selectionCount');
  const summary=document.querySelector('#ritualSummary');
  const summaryText=document.querySelector('#summaryText');
  const summaryTags=document.querySelector('#summaryTags');
  const shortNames={
    'Vibrational Medicine':'Vibrational Medicine',
    'Energy Work — Reiki, Polarity & Craniosacral':'Energy Work',
    'Quantum Subconscious Reprogramming':'Quantum Reprogramming',
    'Plant-Assisted Journey':'Plant-Assisted Journey',
    'Gentle Breathwork':'Gentle Breathwork',
    'Personalized Reusable Recording':'Personalized Recording',
    'Integration & Embodiment':'Integration',
    'Holistic Health & Functional Wellness':'Holistic Wellness'
  };
  function updateRitual(){
    const selected=choices.filter(choice=>choice.checked).map(choice=>choice.value);
    selectedField.value=selected.length?selected.join(' · '):'Not yet selected';
    selectionCount.textContent=selected.length?`${selected.length} element${selected.length===1?'':'s'} selected`:'Nothing selected yet';
    summary.classList.toggle('active',selected.length>0);
    summaryText.textContent=selected.length===0?'Begin by selecting the elements that speak to you.':selected.length===1?'A focused private experience shaped around what is calling you now.':'A personalized tapestry is beginning to take shape around your intentions.';
    summaryTags.replaceChildren(...selected.map(value=>{const tag=document.createElement('span');tag.textContent=shortNames[value]||value;return tag;}));
  }
  choices.forEach(choice=>choice.addEventListener('change',updateRitual));
  const nextField=document.querySelector('#formNext');
  nextField.value=`${location.origin}${location.pathname.replace(/[^/]*$/,'')}thank-you.html`;
}
