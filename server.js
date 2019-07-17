const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const session = require('express-session');
const postgreSqlStore = require('connect-pg-simple')(session);
const cookieParser = require('cookie-parser');
const multer = require('multer');
const ejs = require('ejs');
const WebSocket = require('ws');
const fs = require('fs');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({ storage: storage});


const client = new Client ({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1234',
    port: 5432
})

client.connect();

var sessionOptions = session ({
    secret: "secret",
    resave : true,
    saveUninitialized : false,
    cookie: {
        maxAge: 60 * 60 * 1000
    },
    store: new postgreSqlStore({
        conString: "postgres://postgres:1234@localhost:5432/postgres"
    })
});

let app = express();

app.use('/public', express.static(__dirname +  '/public'));
// app.use('/js', express.static(__dirname + '/public/js'));

app.use(bodyParser.json({
    limit: '50mb', 
    extended: true
}));

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use(cookieParser());
app.use(sessionOptions);
// app.use(session(sessionOptions));

let PUBLIC_DIR = path.join(__dirname, 'public');
let HTML_PUBLIC = path.join(PUBLIC_DIR, 'index.html');

app.engine('html', ejs.renderFile);
app.set('/views', path.join(__dirname, '/views'));
app.set("view engine", "ejs");



// главная страница
app.get('/', function(req, res) {
    if (req.session.user) {
        if (req.session.user.priot == 1) {
            res.redirect('/admin');
        } else {
            res.redirect('/user');
        }
    } else {
        res.sendFile(HTML_PUBLIC);
    }
})

// проверка входа пользователя
app.post('/login',async function(req, res) {
    var login = req.body.login;
    var password = req.body.password;

    let result = await client.query("SELECT id, login, priot FROM users WHERE login=$1 AND password=$2",[login, password]);
    let resolve;
    if (result.rowCount == 1) {
        if (result.rows[0].priot == 1) {
            req.session.user = result.rows[0];
            resolve = '/admin';
        }
        if (result.rows[0].priot == 0) {
            req.session.user = result.rows[0];
            resolve = '/user';
        }
    }

    res.send(JSON.stringify({url: resolve}));
})

// выход пользователя
app.get('/logout', function (req, res) {
    req.session.user = undefined;
    return res.send(JSON.stringify({url: '/'}));
})

// проверка на автризованноссть, проверка на админа, загрузка обращений 
app.get('/admin', async function(req, res) {
    if (req.session.user) {
        if (req.session.user.priot == 1) {
            let result = await client.query("SELECT * FROM messages");
            res.render('second.ejs', {
                messages: result.rows,
            });
        } else {
            res.redirect('/user');
        }
    } else {
        res.redirect('/');
    } 
});

// загрузка обращений
app.get('/loadmessages',async function(req, res) {
    let result = await client.query("SELECT * FROM messages");    
    res.send(JSON.stringify(result.rows));
})

// проверка на автризованноссть, проверка на user
app.get('/user', function(req, res) {
    if (req.session.user) {
        if (req.session.user.priot == 1 || req.session.user.priot == 0) {
            res.sendFile(path.join(PUBLIC_DIR, 'user.html'));
        }
    } else {
        res.redirect('/');
    }
})

// прием новых обращений, загрузка в бд
app.post('/inputMessages',upload.single('file'), async function(req, res) {
    if (req.session.user) {
        var title = req.body.title;
        var descr = req.body.descr;
        var user = req.session.user.login
        var status = 0;
        var filename;
        if (!req.file) {
            filename = null;
        } else {
            filename = req.file.filename;
        }

        let result = await client.query('INSERT INTO messages (username, title, descr, status, filename) VALUES ($1, $2, $3, $4, $5)', [user, title, descr, status, filename]);
        res.redirect('/user');
    } else {
        return res.redirect('/');
    }
})

// обновление статуса обращения
app.post('/updateMessages', async function(req, res) {
    let result = await client.query('UPDATE messages SET status=1 WHERE id=$1', [req.body.id]);
})

// скачивание файла
app.get('/download/:id', function(req, res) {
    var fileLocation = path.join('./public/upload/', req.params.id);
    res.download(fileLocation, req.params.id);
})

// загрузка сообщения в чате 
app.post('/inputImgChat', upload.single('file'), function(req, res) {
   if (req.file) {
       res.send(JSON.stringify({filename: req.file.filename}));
   }
})

// загрузка обрезанной картинки из cropper, отправка обработанной картинки на скачивание 
app.post('/uploadImg', function (req, res) {  
    let image = req.body.cropped_img.replace(/^data:image\/png;base64,/,"");
    let dirSave = path.join(PUBLIC_DIR, 'cropped');
    let file = path.join(dirSave, 'resultCropped.jpg');
    
    fs.writeFileSync(file, Buffer.from(image, "base64"), function (error) {  
        if (error) {
            console.log(error);
        }
    });
    let fileLocation = path.join('./public/cropped/', 'resultCropped.jpg');
    res.download(fileLocation, 'resultCropped.jpg');
})

const wss = new WebSocket.Server({
    port: 3001
});

wss.on('connection', function(ws) {
    ws.room = [];
    ws.name;
    // обработчик сообщений чата 
    ws.on('message', function(data) {
        let message = JSON.parse(data);
        if (message.join) {
            ws.name = message.name;
            let isRooom = false;
            wss.clients.forEach(client => {
                if (client.name == message.name){
                    let room = message.join;
                    if (client.room.indexOf(room) > -1) {
                        isRooom = true;
                    }
                }
            })
            if (!isRooom) {
                ws.room.push(message.join);
            }
        }
        if (message.room) {
            broadcast(message);
        }
    });

    ws.on('close', function () {
        // console.log('disconnected');
    });
});

// отправка сообщений подключенным пользователям
function broadcast (message) {
    wss.clients.forEach(client => {
        let room = message.room;
        if (client.room.indexOf(room) > -1) {
            client.send(JSON.stringify(message));
        }
    });
}

app.listen(3000);

