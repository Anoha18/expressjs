var btn = document.getElementById('btn');

btn.addEventListener('click', function () {
    var login = document.getElementById('login').value;
    var password = document.getElementById('password').value;

    let userData = {
        login: login,
        password: password
    }

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(userData)
    }).then((response) => {
        return response.json();
    }).then((data) => {
        if (!data.url) {
            return;
        }
        window.location.href = data.url;
    }).catch((error) => {
        console.log(error);
    })
})