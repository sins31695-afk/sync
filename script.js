// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Shop filter chips (purely visual filtering by data-category)
  const chips = document.querySelectorAll('.chip[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  if(chips.length){
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        let shown = 0;
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.category === filter;
          card.style.display = match ? '' : 'none';
          if(match) shown++;
        });
        const countEl = document.querySelector('.result-count');
        if(countEl) countEl.textContent = shown + ' pieces';
      });
    });
  }

  // Newsletter + contact form: prevent real submit, show inline confirmation
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = form.querySelector('.form-status');
      if(msg) msg.textContent = form.dataset.successMsg || 'Thank you — we\u2019ll be in touch.';
      form.reset();
    });
  });

  // Footer year
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
});
