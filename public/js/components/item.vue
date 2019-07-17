<template>
    <div>
        <div class="message-list-item" v-bind:id="message.id" @click="active = !active" :key="message.id">
            <div class="message-list-item-title"> {{ message.title }} </div>
            <div v-if="message.status==0" class="message-list-item-status"> Новое </div>
            <div v-else class="message-list-item-status-processed"> Обработано </div>
            <div v-if="active && !modal" class="message-list-item-text"> {{ message.descr }} </div>
            <a v-if="message.filename != null" v-bind:href="'/download/' + message.filename">Файл</a>
            <div v-if="modal" class="message-list-item-dialog" v-bind:id="message.id">
                <div class="modal-conent mContent">
                    <div class="modal-header">
                        Диалог
                    </div>
                    <div class="modal-body mBody" :id="message.id">
                        <itemChat v-for="item in chats" :key="item.id" v-bind:id="id" v-bind:chat="item"></itemChat>
                    </div>
                    <div class="modal-footer mFooter">
                        <input type="text" class="form-control" placeholder="Сообщение" v-bind:id="message.id" v-model="text" v-on:keydown="sendMessage">
                        <input type="file" v-bind:id="message.id" v-on:change="sendFile">
                        <button class="btn btn-primary" type="button" @click="sendMessage" v-bind:id="message.id">Отправить</button>
                    </div>
                </div>
            </div>
        </div>
        <button v-if="message.status==0" @click="modal = !modal" type="button" v-bind:id="message.id" class="btn btn-primary btn-modal">
            <span v-if="!modal"> Открыть диалог </span>
            <span v-else> Закрыть </span>
        </button>
    </div>
</template>

<script>
import itemChat from './item-chat.vue';

export default {
    components: {
        itemChat,
    },
    props: ['message', 'chat', 'socket'],    
    data: function () {
        return {
            text: '',
            chats: this.chat,
            active: false,
            modal: false,
            id: this.message.id,
            file: false,
            filename: '',
            ws: this.socket
        }
    },
    methods: {
        // отправка сообщений в чат
        sendMessage: function(e) {
            let vm = this;
            if (e.keyCode == 13 || e.type == 'click') {
                if (this.text != '') {
                    let id = String(this.id);
                    let data = {
                        room: id,
                        user: 'user',
                        text: this.text,
                        filename: this.filename
                    }
                    vm.ws.send(JSON.stringify(data));
                    this.text = '';
                }
            }


            return;
        },
        // отправка файлов перед отправкой сообщения в чат 
        sendFile: function (e) {
            let vm = this;
            let data = new FormData();
            data.append('file', e.target.files[0])  
            fetch('/inputImgChat', {
                method: 'POST',
                body: data
            }).then(res => {
                return res.json();
            }).then(response => {
                vm.filename = response.filename;
                vm.file = true;
            }).catch(error => {
                console.log(error);
            })
        }
    },
    watch: {
        // слушатель изменений modal, отправка сообщений подключения сокет
        modal: function (val) {
            if (val) {
                let id = String(this.id);
                this.ws.send(JSON.stringify({
                    join: id,
                    name: 'user'
                }));
            }
        },
    }
}
</script>