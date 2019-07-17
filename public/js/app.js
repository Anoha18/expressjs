// const ws = new WebSocket('ws://localhost:3001');
// ws.onopen = function () {
//     console.log('Connection');
// };
import App from './app.vue';

new Vue({
    el: '#app',
    template: '<App />',
    components: {
        App
    }
});
    