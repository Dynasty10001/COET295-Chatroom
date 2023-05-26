const express = require('express');
const bp = require('body-parser');
const session = require('express-session');
const PORT = process.env.PORT || 8081;
const http = require('http');
const app = express();
const server = http.createServer(app);
const {OAuth2Client} = require('google-auth-library');
const env = require('dotenv');


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

app.use(function(req,res,next){
    if(process.env.NODE_ENV != "production"){
        res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    }
    next();
})
app.use(checkLoggedIn);

app.set('view engine', 'ejs');
console.log(`http://localhost:${PORT}`);

let name;
const CLIENTID = process.env.CLIENTID;
const TENORAPIKEY = process.env.TENORAPIKEY



// Login GET
app.get('/login', (req,res) =>{
    res.render('login.ejs', {clientid: CLIENTID});
});

// Login POST
app.post('/login', async (req,res) => {
    try {
        let user = await verifyLogin(req.body.credential, CLIENTID);

        req.session.loggedin = true;
        req.session.username = user.givenname;
        name = req.session.username;
        res.redirect('/');
    } catch {
        res.send("Invalid Login");
    }
});

// Logout POST
app.post('/logout', (req,res) => {
    delete req.session;
    res.redirect('/');
});

// Main Chatroom Page GET
app.get('/', async(req, res) => {
    res.render('index.ejs', {name: req.session.username, tenorkey: TENORAPIKEY})
});

// socket io functionality 
io.on('connection', (socket) => {
    // emit join message 
    socket.on('joining msg', (name) => {
        io.emit('chat message', `---${name} has joined the chat---`);
    });

    // broadcast chat message
    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
    });

    // broadcast image message
    socket.on('img message', (img) => {
        socket.broadcast.emit('img message', img);
    });
});

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});

// function to verify login and set the necessary credentials used bny the app
// modified slightly from the class project
async function verifyLogin(credential, clientid) {
    const client = new OAuth2Client(clientid);
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientid,
    });
    const payload = ticket.getPayload();
    const userinfo = {
        givenname: payload.given_name,
    }

    return userinfo;
}

// function to check that the user is logged in and redirect to the login page if they are not
// taken from the class project
function checkLoggedIn(req, res, next) {
    if (req.session.loggedin || req.path =='/login') {
        next();
    } else {
        res.redirect('/login');
    }
}