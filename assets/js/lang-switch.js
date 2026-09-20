(function () {
  document.querySelectorAll('.lang-switch').forEach(function (el) {
    var trigger = el.querySelector('.lang-switch__current');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = el.classList.contains('is-open');
      document.querySelectorAll('.lang-switch.is-open').forEach(function (o) { o.classList.remove('is-open'); });
      if (!isOpen) el.classList.add('is-open');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.lang-switch.is-open').forEach(function (o) { o.classList.remove('is-open'); });
  });
})();
