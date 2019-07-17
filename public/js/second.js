const ws = new WebSocket('ws://localhost:3001');

ws.onopen = function () {
    console.log('Connected');
};

function close () {
    ws.onclose = function () {
        console.log('Disconnect');
    }
}

// слушатель сообщений сокета, рапспределение сообщений по чатам 
ws.onmessage = function(response) {
    if (!response.data) {
        return;
    }

    let message = JSON.parse(response.data)

    if (message.room != id) {
        return;
    }

    let modal = '#modalBody' + id;
    if (!message.filename) {
        if (message.user != 'admin') {
            $(modal).append(`<div class="chat-item-other">` + message.user + `: ` + message.text + `</div>`);
        } else {
            $(modal).append(`<div class="chat-item-my"><span>Вы</span>: ` + message.text + `</div>`);
        }
        return;
    }
    
    if (message.user != 'admin') {
        $(modal).append(`<div class="chat-item-other"><div class="chat-item-img"><img src="/download/` + message.filename + `" ></div>` + message.user + `: ` + message.text + `</div>`);
    } else {
        $(modal).append(`<div class="chat-item-my"><div class="chat-item-img"><img src="/download/` + message.filename + `" ></div><span>Вы</span>: ` + message.text + `</div>`);
    }
}

$(document).ready(function () {

    let id;

    // раскрытие обращений
    $('.message-list-item').click(function () {
        let target = event.target;
        let id;
        let messageItems = document.getElementsByClassName('message-list-item');
        for (let i = 0; i < messageItems.length; i++) {
            messageItems[i].children[3].style.display = 'none';
        }
        
        if (target.className == 'message-list-item') {
            
            target.children[3].style.display = 'block';
            id = target.id;
        }
        if (target.className == 'message-list-item-title' ||
        target.className == 'message-list-item-subtitle' ||
        target.className == 'message-list-item-status') {
            target.parentNode.children[3].style.display = 'block';
            id = target.parentNode.id;
        }
            
    

        if (id) {
            let data = {
                id: id
            };

            fetch('/updateMessages', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(data)
            }).catch(error => {
                console.log(error);
            })
        }

    });

    let isFile = false;
    let fileName;

    // слушатель событий на нажатие кнопок, открытие чата, отправка сообщений по сокету 
    $('button').click(function (e) {
        if (e.target.id != 'buttonSend') {
            $('.message-list-item-dialog').css('display', 'none');
            id = e.target.id
            let modal = '#modal' + id;
            $(modal).css('display', 'block');
            ws.send(JSON.stringify({
                join: id,
                name: 'admin'
            }));
            let input = '#inputFile' + id;
            inputFile = $(input).change(function (e) {
                let data = new FormData();
                let file = $(input).prop('files')[0];
                data.append('file', file);
                fetch('/inputImgChat', {
                    method: 'POST',
                    body: data
                }).then(res => {
                    return res.json();
                }).then(response => {
                    fileName = response.filename;
                    isFile = true;
                }).catch(error => {
                    console.log(error);
                })
            })
        }
        if (e.target.id == "buttonSend") {
            let input = '#inputMessage' + id;
            let message = $(input).val();

            if (message == '') {
                return;
            }

            if (!isFile) {
                ws.send(JSON.stringify(data = {
                    room: id,
                    user: 'admin',
                    text: message,
                }));
                $(input).val('');
            }
            if (isFile) {
                ws.send(JSON.stringify(data = {
                    room: id,
                    user: 'admin',
                    text: message,
                    filename: fileName
                }));
                $(input).val('');
                isFile = false;
            }

            ws.onmessage = function(response) {
                if (!response.data) {
                    return;
                }
            
                let message = JSON.parse(response.data)
            
                if (message.room != id) {
                    return;
                }
            
                let modal = '#modalBody' + id;
                if (!message.filename) {
                    if (message.user != 'admin') {
                        $(modal).append(`<div class="chat-item-other">` + message.user + `: ` + message.text + `</div>`);
                    } else {
                        $(modal).append(`<div class="chat-item-my"><span>Вы</span>: ` + message.text + `</div>`);
                    }
                    return;
                }

                if (message.user != 'admin') {
                    $(modal).append(`<div class="chat-item-other"><div class="chat-item-img"><img src="/download/` + message.filename + `" ></div>` + message.user + `: ` + message.text + `</div>`);
                } else {
                    $(modal).append(`<div class="chat-item-my"><div class="chat-item-img"><img src="/download/` + message.filename + `" ></div><span>Вы</span>: ` + message.text + `</div>`);
                }
            }
        }
    })

    // слушатель событий на нажатие картинок, загрузка cropper
    $('body').on('click','img', function (e) {
        let fileName = e.target.src.split('/');
        $('#file_name').attr('value',fileName[4]);
        $('#canvasModal').modal('show');
        let canvas = $('#canvas');
        let context = canvas.get(0).getContext('2d');
        let img = new Image();
        img.onload = function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.canvas.height = img.height;
            context.canvas.width = img.width;
            context.drawImage(img, 0, 0);
            canvas.cropper('destroy');
            let cropper = canvas.cropper({
                aspectRatio: 16 / 9
            });

        }

        $('#crop').click(function () {  
            let croppedImage = canvas.cropper('getCroppedCanvas').toDataURL('image/jpg');
            $('#result-cropper').empty();
            $('#result-cropper').append($('<img>').attr('src', croppedImage));
            $('#cropped_img').attr('value', croppedImage);
            $('#upload_img').removeAttr('disabled');
        })

        img.src = '';
        img.src = e.target.src;
       
    })

    var btnLogout = document.getElementById('logout');

    // отключение пользователя
    btnLogout.addEventListener('click', function () {
        fetch('/logout', {
            method: 'GET'
        }).then(res => {
            return res.json();
        }).then(response => {
            window.location.href = response.url;
        })
    });

})