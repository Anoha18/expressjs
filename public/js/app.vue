<template>
    <div>
        <div class="button">
            <div class="label">
                User
            </div>
            <button class="btn btn-secondary" type="submit" @click="logout">Выход</button>
        </div>
        <div class="container">
            <h3>Форма обращения</h3>
            <form @submit="checkForm" class="form-ticket col-md-12" action="/inputMessages" method="POST" enctype="multipart/form-data">
                <input v-model="title" name="title" id="title" class="form-control" type="text" placeholder="Обращение">
                <input id="file" type="file" class="form-control" name="file">
                <textarea name="descr" class="form-control" id="descr" rows="3" placeholder="Описание"></textarea>
                <button type="submit" class="btn btn-primary" id="btn">Отправить</button>
            </form>
            <h3>Отправленные обращения:</h3>
            <div class="message-list col-md-12" id="message-list">
                <item v-for="message in messages" v-bind:chat="chat" v-bind:message="message" :socket="ws" :key="message.id"></item>
            </div>
        </div>
        <div class="modal fade bd-example-modal-lg" id="canvasModal" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content modal-canvas">
                    <button id="crop" class="btn btn-primary">Обрезать</button>
                    <div id="cropper">
                    </div>
                    <div id="result-cropper"></div>
                    <form action="/uploadImg" method="POST">
                        <input type="hidden" name="file_name" id="file_name">
                        <input type="hidden" name="cropped_img" id="cropped_img">
                        <button class="btn btn-primary" type="submit" id="upload_img" name="upload_img" disabled>Сохранить</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import item from './components/item.vue'

export default {
    components: {
        item
    },
    data() {
        return {
            title: '',
            chat: [],
            messages: [],
            ws: null
        }
    },
    created() {
        let vm = this;
        // загрузка обращений
        fetch('/loadmessages', {
            method: 'GET'
        }).then(res => {
            return res.json();
        }).then(response => {
            vm.messages = response;
        })

        this.ws = new WebSocket('ws://localhost:3001');

        this.ws.onopen = function () {
            console.log('Connection');
        };
        this.ws.onmessage = function(response) {
            let res = JSON.parse(response.data);
            vm.chat.push(res)
        };
    },
    methods: {
        // обработчик выхода пользователя 
        logout: function() {
            fetch('/logout', {
                method: 'GET'
            }).then(res => {
                return res.json();
            }).then(response => {
                window.location.href = response.url;
            }).catch(error => {
                console.log(error);
            })
            
        },
        // проверка формы
        checkForm: function(e) {
            if (this.title != '') {
                return true;            
            }
            e.preventDefault();
        },
    },
}
</script>