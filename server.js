const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
require('dotenv').config();
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

var db;
MongoClient.connect(process.env.DB_URL, (err, client)=>{

    if(err){return console.log(err);}

    db = client.db('todoapp');

    app.listen(process.env.PORT, ()=>{
        console.log('listening on 8080\nhttp://localhost:8080');
    });

});

app.get('/', (req, res)=>{
    res.render('index.ejs');
});

app.get('/write', (req, res)=>{
    res.render('write.ejs');
});

app.post('/add', (req,res)=>{
    db.collection('counter').findOne({name : '게시물갯수'}, (err, result)=>{
        console.log(result.totalPost);
        var totalPost = result.totalPost;
        db.collection('post').insertOne({_id : totalPost+1, 제목 : req.body.title, 날짜 : req.body.date},(err, result)=>{
            console.log('저장완료');
        });
        db.collection('counter').updateOne({name : '게시물갯수'},{$inc : {totalPost:1}},(err, result)=>{if(err){return console.log(err);}});
        res.redirect('/list');
    });
});

app.get('/list', (req, res)=>{
    db.collection('post').find().toArray((err, result)=>{
        console.log(result);
        res.render('list.ejs', {posts : result});
    });
});

app.delete('/delete', (req, res)=>{
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, (err, result)=>{
        console.log('삭제완료');
        res.status(200).send({message : '성공했습니다'});
    });
});

app.get('/detail/:id', (req, res)=>{
    db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result)=>{
        console.log(result);
        res.render('detail.ejs', { data : result});
    });
});

app.get('/edit/:id', (req, res)=>{
    db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result)=>{
        console.log(result);
        res.render('edit.ejs', { post : result});
    });
});

app.put('/edit', (req, res)=>{
    db.collection('post').updateOne({_id : parseInt(req.body.id)},{$set : {제목: req.body.title, 날짜: req.body.date}},(err, result)=>{
        console.log('수정완료');
        res.redirect('/list');
    });
});

app.get('/fail', (req, res)=>{
    res.send('로그인에 실패했습니다.');
});







//passport
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

app.get('/login', (req, res)=>{
    res.render('login.ejs');
});
app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), (req, res)=>{
    req.session.save(function(){
        res.redirect('/');
    });
});

app.get('/mypage', loginChk, (req, res)=>{
    console.log(req.user);
    res.render('mypage.ejs', {사용자 : req.user});
});

function loginChk(req, res, next){
    if(req.user){
        next();
    } else {
        res.send('로그인 안 하셨는데요?');
    }
}

app.get('/logout', (req, res)=>{
    req.logout();
    req.session.save(function(){
        res.redirect('/');
    });
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
}));

passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(아이디, done){
    db.collection('login').findOne({id : 아이디}, (err, result)=>{
        done(null, result);
    });
});


