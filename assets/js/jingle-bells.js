(function () {
  // Bouton musique de Noël — joue le fichier audio réel du site (assets/audio/musique-noel.mp3)
  var audio = new Audio('assets/audio/musique-noel.mp3');
  audio.loop = true;
  audio.volume = 0.55;

  var btn = null;
  var playing = false;

  function start() {
    audio.play().then(function () {
      playing = true;
      if (btn) btn.classList.add('is-playing');
    }).catch(function () {
      // autoplay/permission blocked — ignore silently
    });
  }
  function stop() {
    audio.pause();
    playing = false;
    if (btn) btn.classList.remove('is-playing');
  }

  document.addEventListener('DOMContentLoaded', function () {
    btn = document.createElement('button');
    btn.className = 'music-toggle';
    btn.setAttribute('aria-label', 'Musique de Noël');
    btn.innerHTML = '🎵';
    document.body.appendChild(btn);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (playing) stop(); else start();
    });
  });
})();
