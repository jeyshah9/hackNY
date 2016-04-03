
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var Spreadsheet = require('edit-google-spreadsheet');
var async = require('async');
var path = require('path');

var app = express();
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/spreadsheet', function (req, res) {
    var GoogleSpreadsheet = require("google-spreadsheet");
    
    
    // spreadsheet key is the long id in the sheets URL
    var doc = new GoogleSpreadsheet('1HaYrc6H9-EAKuCWDY6o0q2wGz91pH9JE57BYEYew844');
    var sheet1,sheet2;
    
    async.series([
        function setAuth(step) {
            // see notes below for authentication instructions!
            var creds = require('./key.json');
            
            doc.useServiceAccountAuth(creds, step);
        },
        function getInfoAndWorksheets(step) {
            doc.getInfo(function (err, info) {
                console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
                sheet1 = info.worksheets[0];
                sheet2 = info.worksheets[1];
                console.log('sheet 1: ' + sheet1.title + ' '+sheet1.rowCount  + 'x' + sheet1.colCount);

                step();
            });
        } ,
        function workingWithRows(step) {
            // google provides some query options
            sheet1.getRows({
                offset: 1,
                limit: 20,
                orderby: 'col2'
            }, function (err, row) {
                
                console.log(">>> %j",row[0].roomcapacity);
            })
        }

    ]);
    
    
    
    
    res.end();
});
 
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
