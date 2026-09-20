(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var container = document.createElement('div');
  container.className = 'snowfall';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);
  var count = window.innerWidth < 640 ? 16 : 28;
  for (var i = 0; i < count; i++) {
    var flake = document.createElement('span');
    flake.textContent = '❄';
    var size = 10 + Math.random() * 14;
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.fontSize = size + 'px';
    flake.style.opacity = (0.5 + Math.random() * 0.4).toFixed(2);
    flake.style.animationDuration = (9 + Math.random() * 10) + 's';
    flake.style.animationDelay = (Math.random() * 12) + 's';
    flake.style.setProperty('--drift', (Math.random() * 70 - 35) + 'px');
    container.appendChild(flake);
  }
})();
