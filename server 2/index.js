var express = require('express');
var app = express();
var scrpr = require('./lib/scrpr');
var urlScrapr = require('./lib/product_scraper');
var request = require('request');
var fs = require('fs');
var brandScraper = require('./lib/brandScraper');
var stripe = require('./stripe/stripe.api');
var mailer = require('./lib/mailer');
var bodyParser = require('body-parser');
var imageDownloadr = require('./lib/image.downloader');
var deep_scraping = require('./lib/deep_scraping');
const translate = require('google-translate-api');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.all('*', function (req, res, next) {
    var origin = req.get('origin');
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    return next();
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
    response.render('pages/index');
});
app.get('/visage', function (request, response) {
    var bigArray = [];
    fs.readFile('./lib/soins.url.json', function read(err, data) {
        if (err) {
            throw err;
        }
        const jsonV = JSON.parse(data);
        for (var u = 1; u < jsonV.length; u++) {
            scrpr.getVisage(jsonV[u], 'soinsVisage.json')
            if (u === 39) {
                response.send(bigArray);
            }
        }
    });
});
app.get('/parfums', function (request, response) {
    fs.readFile('./lib/parfums.url.json', function read(err, data) {
        if (err) {
            throw err;
        }
        const jsonP = JSON.parse(data);
        for (var u = 1; u < jsonP.length; u++) {
            scrpr.getParfums(jsonP[u], 'parfums.json')
            if (u === 41) {
                response.send('finished')
            }
        }
    });
});
app.get('/channel', function (request, response) {
    scrpr.getParfums('https://www.beautysuccess.fr/chanel/soin?limit=all', 'channelSoins.json')
})
app.get('/parfumBrands', (request, response) => {
    brandScraper.scrapeBrandObjects('parfum').then((brands) => {
        response.send(brands);
    })
});
app.get('/visageBrands', (request, response) => {
    brandScraper.scrapeBrandObjects('visage').then((brands) => {
        response.send(brands);
    })
});
app.get('/allbrandsParfum', function (request, response) {
    fs.readFile('brands/parfums.brands.json', function read(err, data) {
        if (err) {
            throw err;
        }
        const jsonPB = JSON.parse(data);
        console.log(jsonPB)
        for (var u = 1; u < jsonPB.length; u++) {
            scrpr.getParfums(jsonPB[u].url, 'brands/parfums/' + jsonPB[u].name + '.json');
            if (u === jsonPB.length - 1) {
                response.send('stoped');
                return;
            }
        }
    });
});
app.get('/allBrandsVisage', function (request, response) {
    fs.readFile('brands/visage.brands.json', function read(err, data) {
        if (err) {
            throw err;
        }
        const jsonVB = JSON.parse(data);
        for (var u = 1; u < jsonVB.length; u++) {
            scrpr.getVisage(jsonVB[u].url, 'brands/visage/' + jsonVB[u].name + '.json');
        }
    });
});
app.get('/price', (request, response) => {

    const url = request.query.url;
    urlScrapr.scrapUrl(url).then((product) => {
        response.send(product);
    })

})
app.get('/downloadImages', (request, response) => {
    imageDownloadr.downloadImages();
    response.send('download images ...')
})
app.get('/deep_scraping', (request, response) => {
    deep_scraping.perform_deep_scraping();
    response.send('deep scraping')
})

app.post('/charge', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    stripe.createCharge(req.body.amount, req.body.source, req.body.description)
        .then((charge) => {
            res.send(JSON.stringify(charge));
        }, (error) => {
            res.send(error);
        });
})


app.post('/mail', (request, response) => {
    res.setHeader('Content-Type', 'application/json');
    var title = request.body.title || '';
    var body = request.body.emailBody || '';
    mailer.sendEmail(title, body).then((status) => response.send(status))
});

app.get('/mailer', (request, response) => {
    var title = 'new reservation';
    var body = {'prenom': 'jonathan', 'heure de reservation': '11H'};
    mailer.sendEmail(title, body).then((status) => response.send(status))
});



app.post('/translate', (request, response) => {
    var text = request.body.text || '';
    var language = request.language.toLowerCase() || 'en';
    translate(text, {to: language}).then(res => {
        console.log(res.text);
        response.send(res.text);
    }).catch(err => {
        console.error(err);
    });
});


app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
