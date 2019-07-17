<template>
    <div>
        <div v-if="roomId == chat.room">
            <div v-if="chat.user == 'user'" class="chat-item-my">
                <div v-if="chat.filename" class="chat-item-img">
                    <img @click="openModal" v-bind:src="'/download/' + chat.filename">
                </div>
                Вы : {{chat.text}}
            </div>
            <div v-else class="chat-item-other"> 
                <div v-if="chat.filename" class="chat-item-img">
                    <img @click="openModal" v-bind:src="'/download/' + chat.filename">
                </div>
                {{chat.user}} : {{chat.text}}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['chat', 'id'],
    data: function () {
        return {
            roomId: String(this.id),
            src: '',
            image: {}
        }
    },
    methods: {
        // открытие модального окна, загрузка cropper, сохранение результата
        openModal(e) {
            let src = e.target.src;  
            $('#cropper').empty();
            $('#result-cropper').empty();
            $('#canvasModal').modal('show');
            $('#cropper').append($('<img>').attr('id', 'image'));
            $('#image').attr('src', src);
            let image = document.getElementById('image');
            let cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
            })

            $('#crop').click(function() {
                let croppedImage = image.cropper.getCroppedCanvas().toDataURL('image/jpg');
                $('#result-cropper').empty();
                $('#result-cropper').append($('<img>').attr('src', croppedImage));
                $('#cropped_img').attr('value', croppedImage);
                $('#upload_img').removeAttr('disabled');
            })
        },

    }
}
</script>