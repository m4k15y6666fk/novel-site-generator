---
---

window.addEventListener('load', _ => {
    let confirmR18 = localStorage.getItem('r_18');
    if (confirmR18 != 'true') {
        console.log('R18 確認ページへリダイレクトします');

        localStorage.setItem('original_url', location.href);
        location.href = "{{ site.prefix + '/confirm' }}";
    }

    document.body.removeAttribute('hidden');
});
