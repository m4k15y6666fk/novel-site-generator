window.addEventListener('load', _ => {
    const button = document.querySelector('#button-1');
    const renderButton = document.querySelector('#render');
    const div = document.querySelector('#final-content');
    const container = document.querySelector('#container');

    const navigationBar = document.querySelector('#navigation-bar');
    const contentBody = document.querySelector('#content-body');

    div.width = (document.body.offsetWidth / 2) + 'px'
    div.height = (document.body.offsetHeight - navigationBar.offsetHeight) + 'px';

    function update_screen() {
        let content = editor.getValue();
        //console.log('rr:' + content);

        fetch('/render', {
            method: 'POST', // or 'PUT'
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: document.body.dataset.analyze,
                path: location.pathname,
                content: content
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log('Success:', data);

                div.setAttribute('src', '/public' + data.url);
                div.contentDocument.addEventListener('DOMContentLoaded', _ => {
                    div.contentWindow.location.href = '/public' + data.url;
                    div.contentWindow.location.reload();
                });

                UIkit.notification({
                    message: '<span uk-icon=\'icon: check\'></span>Success: rendering successed.',
                    status: 'success',
                    pos: 'bottom-right',
                    timeout: 1000
                });
            } else {
                console.log('Error:', data);

                UIkit.notification({
                    message: '<span uk-icon=\'icon: close\'></span>Error: rendering failed.',
                    status: 'danger',
                    pos: 'bottom-right',
                    timeout: 3000
                });
            }

        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    renderButton.addEventListener('click', update_screen);
    button.addEventListener('click', update_screen);

    button.addEventListener('click', _ => {
        let save_content = editor.getValue();

        fetch('/save' + location.pathname, {
            method: 'POST', // or 'PUT'
            headers: {
            'Content-Type': 'text/plain',
            },
            body: save_content,
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log('Save: ', data.content);
                UIkit.notification({
                    message: '<span uk-icon=\'icon: check\'></span>Success: saving: ' + data.content,
                    status: 'success',
                    pos: 'bottom-right',
                    timeout: 3000
                });
            } else {
                console.log('Error: saving: ', data.content);
                UIkit.notification({
                    message: '<span uk-icon=\'icon: close\'></span>Error: saving: ' + data.content,
                    status: 'danger',
                    pos: 'bottom-right',
                    timeout: 3000
                });
            }

        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});
