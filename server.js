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



app.get('/', async(req, res) => {
    res.render('index.ejs', {name: 'Kyle'});
});


server.listen(9000, () => {
    console.log(`Listening on port: ${PORT}`);
});