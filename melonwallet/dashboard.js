(function () {
    'use strict';

    var body = document.body;

    // Persistência do tema: aplica a escolha salva assim que a página carrega.
    // O ícone (Sol/Lua) já é controlado via CSS pela classe .light-melon-mode, então fica sincronizado.
    if (localStorage.getItem('melon-theme') === 'light') {
        body.classList.add('light-melon-mode');
    }

    var toggle = document.getElementById('btn-theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
        var isLight = body.classList.toggle('light-melon-mode');
        localStorage.setItem('melon-theme', isLight ? 'light' : 'dark');
    });
})();
