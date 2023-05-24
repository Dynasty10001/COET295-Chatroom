const express = require('express');
const bp = require('body-parser');
const session = require('express-session');
const PORT = process.env.PORT || 9000;
const http = require('http');
const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bp.urlencoded({extended: true}));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    unset: 'destroy'
}));

app.set('view engine', 'ejs');
console.log(`http://localhost:${PORT}`);

var name = 'Kyle';

app.get('/', async(req, res) => {
    res.render('index.ejs', {name: name});
});

io.on('connection', (socket) => {
    socket.on('joining msg', (name) => {
        io.emit('chat message', `---${name} has joined the chat---`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        io.emit('chat message', `---${name} has left the chat---`);
      });

      socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
      });
});

server.listen(9000, () => {
    console.log(`Listening on port: ${PORT}`);
});