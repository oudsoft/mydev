require('dotenv').config({ path: 'variables.env' });
const bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var app = express();
const	 {Client} = require('pg');
const client = new Client({
  user: 'sasurean',
  host: '202.28.68.11',
  database: 'shopdb',
  password: 'drinking',
  port: 1486,
})
client.connect();

const QRDOWNLOAD_FOLDER = 'qrdownload';

app.engine('html', require('ejs').renderFile);//for render html file in views folder
const qrcodetextgen = require('./qrcodetextgen');
//const errorLog = require('./logger').errorlog;
//const successlog = require('./logger').successlog;
const winston = require('winston');
require('winston-daily-rotate-file');
function getLogger(module) {
	const transport = new winston.transports.DailyRotateFile({
		filename: './logs/log-%DATE%.txt',
		datePattern: 'YYYY-MM-DD',
		prepend: true,
		/* level: process.env.ENV === 'development' ? 'silly' : 'error', */
		level: 'silly'
	});
	const logger = winston.createLogger({
		transports: [transport],
	});
	return logger;
}  

app.get('/shop/api', function (request, response) {
	//console.log(JSON.stringify(request.headers));
	getLogger().info(JSON.stringify(request.headers));
	var id = request.query.id; 
	//console.log(id);
	var stringQueryShop = "select * from shop order by id";
	client.query(stringQueryShop, (error, result) => {
		if (error){
			getLogger().error(error);
			client.end();
			return;
		}
		var outputString = "You wanted :" + id + "  \n";
		result.rows.forEach((value) => {
			var itemString = "id=" +value.id + ", name=" + value.name + ", address=" + value.address + ", tel=" + value.tel + ", email=" + value.email + ", shoptypeid=" + value.shoptypeid + ", taxid=" + value.taxid + ", promptno=" + value.promptno + ", promptname=" + value.promptname + ", promptcharge=" + value.promptcharge + ", userupd=" + value.userupd + ", lastupd=" + value.lastupd + "\n";
			outputString = outputString + itemString;
			//console.log(value.name);
		});
		getLogger().info(outputString);
		response.statusCode = 200;
		response.setHeader('Content-Type', 'text/plain');
		response.send(outputString);
		console.log("Client's request was " + "\nsend.");
	});
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 
app.post('/qrimage', function(request, response) {
	const {registerFont, createCanvas, createImageData} = require('canvas');
	registerFont('THSarabunNew.ttf', { family: 'THSarabunNew' })
	const imageCanvas = createCanvas(400, 500);
	const qrcodeCanvas = createCanvas(400, 400);
	//var accountNo = "140000835077746";
	//var totalCharge = "510.00";
	//var accountName = "นายประเสริฐ สุดชดา";
	console.log(request.body);
	console.log(JSON.stringify(request.body));
	var accountNo = request.body.accountNo;
	var accountName = request.body.accountName;
	var totalCharge = request.body.totalCharge;
	console.log(request.query.accountNo);
	console.log(accountNo);
	console.log(accountName);
	console.log(totalCharge);
	const ctx = imageCanvas.getContext('2d');
	ctx.font = 'bold 30px "THSarabunNew"'
	ctx.fillStyle = 'black';
	ctx.textAlign = 'center';
	ctx.fillText("หมายเลขพร้อมเพย์  " + accountNo, 200, 450);
	ctx.fillText("ชื่อบัญชี " + accountName, 200, 480);

	var QRText =  qrcodetextgen.generateQRCodeText(accountNo, totalCharge);
	const QRCode = require('qrcode');
	QRCode.toCanvas(qrcodeCanvas, QRText, function (error) {
		//console.log(error);
		ctx.drawImage(qrcodeCanvas, 0, 0, 400, 400);
		var fs = require('fs');
		var imageFileName = accountNo + "_" + totalCharge + new Date().getTime();
		var imageFileExName = '.png';
		//console.log(__dirname);
		var imagePath =  __dirname + "/"  + QRDOWNLOAD_FOLDER + '/' + imageFileName + imageFileExName;
		const out = fs.createWriteStream(imagePath);
		const stream = imageCanvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () =>  {
			console.log('The PNG file was created at ' + imagePath);
			var imageLink = "http://202.28.68.6/download?imagename=" +imageFileName + imageFileExName;
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/plain');
			response.send(imageLink);
			console.log("Image Link " + imageLink + "\nSend to client.");
		});
	});
});

app.get('/webapp', function(request, response) {
    response.render('index.html');
});

app.get('/download', function(request, response){
	var fileName = request.query.imagename;
	var file = __dirname + '/' + QRDOWNLOAD_FOLDER + '/' + fileName;
	response.download(file); 
});

const verifyWebhook = require('./verify-webhook');
app.get('/', verifyWebhook);

const messageWebhook = require('./message-webhook');
//app.post('/', messageWebhook);
app.post('/', function(request, response) {
	console.log(JSON.stringify(request.body));
	response.statusCode = 200;
	response.setHeader('Content-Type', 'text/plain');
	response.send("OK Play Boy");
});

var server = app.listen(7751, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://%s:%s", host, port);
});
/*
	1.ส่งรูปออกให้เขาดาวน์โหลด
	http://202.28.68.6/qrcode/images/140000835077746_510.001542457057406.png
	2.สร้าง qr จากข้อมูล input ของจริง
	accountNo, accountName, totalCharge
*/
/*
var express = require('express');
var app = express();


server = http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Hello World\n');
});

server.listen(30007);
*/

/*
scp /cygdrive/e/nodep/server.js sasurean@202.28.68.6:/home/sasurean/nodejs
scp /cygdrive/e/nodep/hosts sasurean@202.28.68.6:/etc/hosts

curl -X GET -H "Content-Type:application/json" -H "X-MyHeader: 123" http://202.28.68.6/shop/api -d '{"text":"something"}'
curl -X POST -H "Content-Type:application/json" -H "X-MyHeader: 123" http://202.28.68.6/qrimage -d '{"accountNo": "140000835077746", "accountName": "นายประเสริฐ สุดชดา", "totalCharge": "377.12"}'

/etc/init.d/apache2 restart
service apache2 restart


cd nodejs
node server.js

Navigate to folder and
chmod -R 777 .
*/

/*
var fbId= "XXX";
var fbSecret= "XXXXXX";
var fbCallbackAddress= "http://127.0.0.1:8888/auth/facebook_callback"

var cookieSecret = "node";     // enter a random hash for security

var express= require('express');
var auth = require('connect-auth')
var app = express.createServer();


app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({secret: cookieSecret}));
    app.use(auth([
        auth.Facebook({
            appId : fbId,
            appSecret: fbSecret,
            callback: fbCallbackAddress,
            scope: 'offline_access,email,user_about_me,user_activities,manage_pages,publish_stream',
            failedUri: '/noauth'
        })
    ]));
    app.use(app.router);
});


app.get('/auth/facebook', function(req, res) {
  req.authenticate("facebook", function(error, authenticated) {
    if (authenticated) {
      res.redirect("/great");
      console.log("ok cool.");
      console.log(res['req']['session']);
    }
  });
});

app.get('/noauth', function(req, res) {
  console.log('Authentication Failed');
  res.send('Authentication Failed');
});

app.get('/great', function( req, res) {
  res.send('Supercoolstuff');
});

app.listen(8888);
May I know what is wrong with my code?
*/

/*
var url = require('url');
var url_parts = url.parse(request.url, true);
var query = url_parts.query;
// $_GET["id"]
var id = req.query.id; 
// $_POST["id"]
const bodyParser = require('body-parser');
app.use(bodyParser);

Try passing this in your cURL call:
--header "Content-Type: application/json"
and making sure your data is in JSON format:
{"user":"someone"}
var express = require('express');
var app = express.createServer();

app.use(express.bodyParser());

app.post('/', function(req, res){
    console.dir(req.body);
    res.send("test");
}); 

app.listen(3000);
*/

