//   
// call all the required packages
//---------------------------------
const express = require('express');
//path module gives utilities to work with directory & file paths
const path = require('path');

const fs = require('fs'); // to work with file system on user computer
const session = require('express-session');   //to handle Session


const bodyParser= require('body-parser')  //to extract the entire body of an incoming " Post" data
const multer = require("multer");    // to upload files
const nodemailer = require('nodemailer');  //to be able to send an email
const MongoClient = require('mongodb').MongoClient; // database mongoos
const app = express();
const upload = multer({dest: "uploads/"}); //determine where the path where files will be stored 
var sess; //sess = req.session;    -------> global session
app.set('view engine', 'ejs')
app.use(express.static(__dirname)) //adds static express file  server  
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true})); //to initialize the session and handle cookie
app.use(bodyParser.json()) // parse application/JSON " support encoded bodies of json" 
app.use(bodyParser.urlencoded({ extended: true })) // For supporting URL-encoded bodies
//array of ready profiles information
var others = [
    {
        email: 'sami@gmail.com',
        fname: 'sami',
        dob: '1989-11-01',
        gender: 'm'
    },
    {
        email: 'aymen@gmail.com',
        fname: 'aymen',
        dob: '1987-12-21',
        gender: 'm',
    },
    {
        email: 'shadi@gmail.com',
        fname: 'shadi',
        dob: '1978-09-11',
        gender: 'm',
    },
    {
        email: 'nader@gmail.com',
        fname: 'nader',
        dob: '1977-03-22',
        gender: 'm',
    },
    {
        email: 'rami@gmail.com',
        fname: 'rami',
        dob: '1990-05-15',
        gender: 'm',
    }
];

//db connection
MongoClient.connect("mongodb://localhost:27017/", {
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected to Database')
    const db = client.db('tinderr-db') //create a name of database
    const profilesCollection = db.collection('profiles')
    const matchedCollection = db.collection('matched')


    //view matched profiles
    app.get('/matches',(req,res) => {
        sess = req.session; 
        console.log("matched>>>") 
        matchedCollection.find({email: sess.email}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result[0].likedName);
            //it will bring the names and then bring their profiles
            profilesCollection.find({fname: { $in: result[0].likedName }}).toArray(function(err, rslt) {  
                if (err) {
                 // console.log('issue--------------------------------------------------')
                  throw err};
                console.log("*******"+rslt);
                //call/render the matched-profiles.ejs parsed with the json data
                res.render('matched-profiles.ejs',{profiles:rslt, email:sess.email})
            })
        })
        
    })
    //end view matched profiles


    //save matched 
    app.post('/liked',(req,res) => {
        sess = req.session;  
        let  liked = req.body.liked  // contain the names of liked people
        let likedRow = {email: sess.email, likedName: liked};
        console.log("====="+likedRow)  
        matchedCollection.insertOne({email: sess.email, likedName: liked},function(err, result) {
            if (err) throw err;
            console.log("Number of matched documents inserted: " + result.insertedCount);
          return res.redirect('http://localhost:3000/matches');
           // window.location.replace('http://localhost:3000/matches');
           

        })
        
    })
    //end save matched




    //send email
    app.post('/send-mail',(req,res) => {
        sess = req.session;  
        var name = req.body.fnamee
        console.log('sending mail...')  

         //using SMTP to deliver messages and I have provideed the connection data . I will not use a real email to not bother anyone
        let transport = nodemailer.createTransport({    //using SMTP to deliver messages and I have provideed the connection data . Iwillnot u
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: "b68b58c727107c",
              pass: "024a569757d598"
            }
          });

          let mailOptions = {
            from: '2be4356608-45a554@inbox.mailtrap.io', //This dedicated email address that I can use to send messages from other email accounts or right from my application during the testing process
            to: sess.email,
            subject: 'You have found a match, Congratulations!',
            text: 'You have found a match, '+name+' will contact you soon!'
          };
          
          //start send the email
          transport.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

    })
    //end send email




    //logout
    app.get('/logout',(req,res) => {
        req.session.destroy((err) => {
            if(err) {
                return console.log(err);
            }
            res.redirect('/');
        })    
    })
    //end logout
    //get profiles
    app.get('/profiles', (req, res) => {
        sess = req.session;       
       console.log('view profiles')
       profilesCollection.find({ email: { $ne: sess.email } }).toArray(function(err, result) {    // it will show the profiles except the user profile
        if (err) throw err;
        console.log(result); 
        res.render('profiles.ejs',{profiles: result})       // render the profiles.ejs file
      });
        
    })
    //end get profiles



    //create profile
    app.post('/create-profile', upload.single('photo'), (req, res) => {
        sess = req.session;   // take information of the current session
        sess.email = req.body.email    // extract the email of the current user
        //upload
        const tempPath = req.file.path; // curr
    const targetPath = path.join(__dirname, "./uploads/"+req.body.fname+".jpg");  // it will name the picture based on the use name and stores it in the /uploads file
    if (path.extname(req.file.originalname).toLowerCase() === ".jpg") {
      fs.rename(tempPath, targetPath, err => {
        if (err) return handleError(err, res);
        console.log("File uploaded!");
      });
    } else {
      fs.unlink(tempPath, err => {           // if the profile pic is not jpg extension
        if (err) return handleError(err, res);
        console.log("only jpg");
        
      });
    }
        //end upload
        console.log(req.body.fname+"++++++++++\n")
        console.log('inserting profile..')
        profilesCollection.insertOne(req.body) //insert the account /profile to the profile database
            .then(result => {
                console.log(result)
                res.redirect('/profiles')
            })
            .catch(error => console.error(error))
    })
    //end create profile





    //index "render the Sign up page " 
    app.get('/', (req, res) => {
        console.log('Hi!')
        profilesCollection.deleteMany({}) // every time when open the website it will make the profiles Collection database empty 
        matchedCollection.deleteMany({})  // every time when open the website it will make the match database empty 
        profilesCollection.insertMany(others,function(err, res) {    //start insert the 5 profiles in others array into the profileCollection database
            if (err) throw err;
            console.log("Number of profile documents inserted: " + res.insertedCount);
        })
        res.render('index.ejs', {})
    })
    //end index
  })
//end db
app.listen(3000, function() {
    console.log('[Server] is listening on port 3000');
  })