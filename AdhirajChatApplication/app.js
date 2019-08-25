var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var moment = require('moment');
var flash = require('connect-flash');
var session = require ('express-session');
var app = express();
var server = require('http').createServer(app).listen(3000);
var io = require('socket.io')(server);
const uri = "mongodb+srv://adhiraj:CarnegieMellon123@cluster0-r9mun.mongodb.net/test?retryWrites=true&w=majority";
var Schema   = mongoose.Schema;
mongoose.connect(uri, { useNewUrlParser: true });
var userSchema = new Schema({
  name     : String,
 password  : String,
});
var messageSchema = new Schema({
  time: String,
  value: String,
  username: String
});
var User = mongoose.model('Users', userSchema);
var Message = mongoose.model('Messages', messageSchema);
var saveMessage;
var saveUser;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('User', User);
app.set('Message', Message);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended : false }));
app.use(session({ key: 'key', secret: 'secret', resave: false, saveUninitialized: true, cookie: { secure: true }}));
app.use(flash());
io.on('connection', function (socket) {

socket.on('all-chats', function () {
   Message.find({}, function(err, docs){
    if (!err){ 
      socket.emit('all-chats-return',docs)
    } else {throw err;}
});
});

socket.on('show-message', function (docs){
    var date = moment(new Date()).format("DD/MM/YYYY hh:mm A");
    saveMessage = new Message({value: docs.value, time: date, username: docs.username});
    saveMessage.save(function (err) {
      if (err) console.log(err);
    });
    var returnDoc = ({
      username: docs.username,
      time: date,
      value: docs.value
    });
    io.emit('now-chat-return', returnDoc);
  });
});

app.get('/', function(req, res, next) {
  res.render('form');
});

app.post('/register', function(req, res, next) {
  User.find({name: req.body.name}, function(err, user){
  if (!err){
  if (user.length){
    req.flash('info', "User Already Exists");
    res.render('form', {messages: req.flash('info')})
  }else{
    var saveUser = new User({name: req.body.name, password: req.body.password});
    saveUser.save(function (err) {
    if (err) return handleError(err);
    });
    res.render('chat', {username: JSON.stringify(req.body.name)});
  }
  }else{
    throw err;
  }
  });
});

app.post('/login', function(req, res, next) {
    User.find({name: req.body.name}, function(err, user) {
    if (user.length){
      if (user[0].password == req.body.password){
        res.render('chat', {username: JSON.stringify(req.body.name)});
      }else{
        req.flash('info', "Incorrect Password");
        res.render('form', {messages: req.flash('info')});
      }
    }else{
      req.flash('info', "There is No Record Of This User, Please Register");
      res.render('form', {messages: req.flash('info')});
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
