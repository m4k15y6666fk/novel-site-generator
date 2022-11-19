function toggle_theme() {
    const themeSwitcher = document.querySelector('#theme-switcher');
    const navigationBar = document.querySelector('#navigation-bar');

    if (localStorage.getItem('color-theme') == null) {
        if(window.matchMedia('(prefers-color-scheme: light)').matches == true){
            localStorage.setItem('color-theme', 'light');
        } else {
            localStorage.setItem('color-theme', 'dark');
        }
    }

    if (localStorage.getItem('color-theme') == 'light') {
        navigationBar.classList.remove('uk-background-secondary');
        navigationBar.classList.add('uk-background-muted');

        core_editor.setTheme('vs');

        themeSwitcher.textContent = 'dark_mode';
    } else if (localStorage.getItem('color-theme') == 'dark') {
        navigationBar.classList.remove('uk-background-muted');
        navigationBar.classList.add('uk-background-secondary');

        core_editor.setTheme('vs-dark');

        themeSwitcher.textContent = 'light_mode';
    }

    themeSwitcher.addEventListener('click', e => {
        if (localStorage.getItem('color-theme') == 'dark') {
            navigationBar.classList.remove('uk-background-secondary');
            navigationBar.classList.add('uk-background-muted');

            core_editor.setTheme('vs');

            localStorage.setItem('color-theme', 'light');

            themeSwitcher.textContent = 'dark_mode';
        } else if (localStorage.getItem('color-theme') == 'light') {
            navigationBar.classList.remove('uk-background-muted');
            navigationBar.classList.add('uk-background-secondary');

            core_editor.setTheme('vs-dark');

            localStorage.setItem('color-theme', 'dark');

            themeSwitcher.textContent = 'light_mode';
        }

        //console.log(themeSwitcher.dataset.theme == 'dark');
    });
}

window.addEventListener('load', toggle_theme);
