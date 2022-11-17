---
---

document.addEventListener('DOMContentLoaded', start);

function start() {
    const themeSwitcher = document.querySelector('#theme-switcher');
    const navigationBar = document.querySelector('#navigation-bar');

    if (localStorage.getItem('theme') == null) {
        if(window.matchMedia('(prefers-color-scheme: light)').matches == true){
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    }

    if (localStorage.getItem('theme') == 'light') {
        document.body.classList.remove('uk-light', 'uk-background-secondary');
        document.body.classList.add('uk-dark', 'uk-background-default');

        navigationBar.classList.remove('uk-background-secondary');
        navigationBar.classList.add('uk-background-muted');

        themeSwitcher.textContent = 'dark_mode';
    } else if (localStorage.getItem('theme') == 'dark') {
        document.body.classList.remove('uk-dark', 'uk-background-default');
        document.body.classList.add('uk-light', 'uk-background-secondary');

        navigationBar.classList.remove('uk-background-muted');
        navigationBar.classList.add('uk-background-secondary');

        themeSwitcher.textContent = 'light_mode';
    }

    themeSwitcher.addEventListener('click', e => {
        if (localStorage.getItem('theme') == 'dark') {
            document.body.classList.remove('uk-light', 'uk-background-secondary');
            document.body.classList.add('uk-dark', 'uk-background-default');

            navigationBar.classList.remove('uk-background-secondary');
            navigationBar.classList.add('uk-background-muted');

            localStorage.setItem('theme', 'light');

            themeSwitcher.textContent = 'dark_mode';
        } else if (localStorage.getItem('theme') == 'light') {
            document.body.classList.remove('uk-dark', 'uk-background-default');
            document.body.classList.add('uk-light', 'uk-background-secondary');

            navigationBar.classList.remove('uk-background-muted');
            navigationBar.classList.add('uk-background-secondary');

            localStorage.setItem('theme', 'dark');

            themeSwitcher.textContent = 'light_mode';
        }

        //console.log(themeSwitcher.dataset.theme == 'dark');
    });
}
