/* Native disclosures stay usable without scripts; anchors reveal their destination. */
(() => {
  function reveal(hash){
    if(!['#plain-az','#plain-area','#plain-category','#fd-reference-notes'].includes(hash))return;
    const target=document.getElementById(hash.slice(1));if(target)target.open=true;
  }
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a)reveal(a.getAttribute('href'));});
  addEventListener('hashchange',()=>reveal(location.hash));reveal(location.hash);
})();
