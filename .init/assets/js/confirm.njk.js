document.addEventListener('DOMContentLoaded', start);

function start() {
    const themeSwitcher = document.querySelector('#theme-switcher');
    const navigationBar = document.querySelector('#navigation-bar');

    const r18Icon = {
        light: document.querySelector('#r-18-icon-light'),
        dark: document.querySelector('#r-18-icon-dark')
    };

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

        r18Icon.dark.removeAttribute('hidden');

        themeSwitcher.textContent = 'dark_mode';
    } else if (localStorage.getItem('theme') == 'dark') {
        document.body.classList.remove('uk-dark', 'uk-background-default');
        document.body.classList.add('uk-light', 'uk-background-secondary');

        navigationBar.classList.remove('uk-background-muted');
        navigationBar.classList.add('uk-background-secondary');

        r18Icon.light.removeAttribute('hidden');

        themeSwitcher.textContent = 'light_mode';
    }

    themeSwitcher.addEventListener('click', e => {
        if (localStorage.getItem('theme') == 'dark') {
            document.body.classList.remove('uk-light', 'uk-background-secondary');
            document.body.classList.add('uk-dark', 'uk-background-default');

            navigationBar.classList.remove('uk-background-secondary');
            navigationBar.classList.add('uk-background-muted');

            r18Icon.light.setAttribute('hidden', 'true');
            r18Icon.dark.removeAttribute('hidden');

            localStorage.setItem('theme', 'light');

            themeSwitcher.textContent = 'dark_mode';
        } else if (localStorage.getItem('theme') == 'light') {
            document.body.classList.remove('uk-dark', 'uk-background-default');
            document.body.classList.add('uk-light', 'uk-background-secondary');

            navigationBar.classList.remove('uk-background-muted');
            navigationBar.classList.add('uk-background-secondary');

            r18Icon.dark.setAttribute('hidden', 'true');
            r18Icon.light.removeAttribute('hidden');

            localStorage.setItem('theme', 'dark');

            themeSwitcher.textContent = 'light_mode';
        }

        //console.log(themeSwitcher.dataset.theme == 'dark');
    });

    let originalURL = location.host;
    if (localStorage.getItem('original_url')) {
        originalURL = localStorage.getItem('original_url');
    }

    const confirmButton = document.querySelector('#confirm-button');
    const rejectButton = document.querySelector('#reject-button');

    confirmButton.addEventListener('click', _ => {
        localStorage.setItem('r_18', 'true');
        location.href = originalURL;
    });

    rejectButton.addEventListener('click', _ => {
        history.go(-2);
    });
}
