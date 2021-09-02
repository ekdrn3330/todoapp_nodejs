const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.o5qxw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', (err, client)=>{

    if(err){return console.log(err);}

    db = client.db('todoapp');

    app.listen(8080, ()=>{
        console.log('listening on 8080');
    });

});

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html');
});

app.get('/write', (req, res)=>{
    res.sendFile(__dirname + '/write.html');
});

app.post('/add', (req,res)=>{
    res.send('전송완료');
    db.collection('counter').findOne({name : '게시물갯수'}, (err, result)=>{
        console.log(result.totalPost);
        var totalPost = result.totalPost;
        db.collection('post').insertOne({_id : totalPost+1, 제목 : req.body.title, 날짜 : req.body.date},(err, result)=>{
            console.log('저장완료');
        });
        db.collection('counter').updateOne({name : '게시물갯수'},{ $inc : {totalPost:1}},(err, result)=>{if(err){return console.log(err);}});
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
    db.collection('post').deleteOne(req.body, (err, result)=>{console.log('삭제완료');});
});

