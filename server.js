const express = require('express');
const bp = require('body-parser');
const session = require('express-session');
const PORT = process.env.PORT || 8081;
const http = require('http');
const app = express();
const server = http.createServer(app);
const {Datastore} = require('@google-cloud/datastore');
const {OAuth2Client} = require('google-auth-library');

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

app.use(function(req,res,next){
    if(process.env.NODE_ENV != "production"){
        res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    }
    next();
})

app.use(checkLoggedIn);

let name;
const CLIENTID = process.env.CLIENTID;
const datastore = new Datastore();

app.get('/login', (req,res) =>{
    console.log('GET from /login');
    res.render('login.ejs', {clientid: CLIENTID});
});

app.post('/login', async (req,res) => {
    console.log('POST to  /login');

    try {
        let user = await verifyLogin(req.body.credential, CLIENTID);

        req.session.loggedin = true;
        req.session.username = user.givenname;
        req.session.userid = user.uid; // leaving for potential future endeavors
        name = req.session.username;
        res.redirect('/');
    } catch {
        res.send("Invalid Login");
    }

});

app.post('/logout', (req,res) => {
    delete req.session;
    res.redirect('/');
});

app.get('/', async(req, res) => {

    res.render('index.ejs', {name: req.session.username})
});

io.on('connection', (socket) => {
    socket.on('joining msg', (name) => {
        io.emit('chat message', `---${name} has joined the chat---`);
    });

    socket.on('disconnect', () => {
        io.emit('chat message', `---${name} has left the---`);
      });

      socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
      });

      socket.on('img message', (img) => {
        console.log(img);
        socket.broadcast.emit('img message', img);
      });
});

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});


async function verifyLogin(credential, clientid) {
    const client = new OAuth2Client(clientid);
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientid,
    });
    const payload = ticket.getPayload();
    const userinfo = {
        givenname: payload.given_name,
        uid: payload.sub,
    }

    return userinfo;
}

function checkLoggedIn(req, res, next) {
    if (req.session.loggedin || req.path =='/login') {
        next();
    } else {
        res.redirect('/login');
    }
}




