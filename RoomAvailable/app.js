
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var Spreadsheet = require('edit-google-spreadsheet');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/hackNY');

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

var RoomSchema = mongoose.Schema({
    roomNumber: String,
    roomCapacity: String,
    roomNotes: String

});

var PersonDataSchema = mongoose.Schema({
    Name: String,
    PhoneNumber: String,
    occupied:String
});

var Rooms = mongoose.model('Rooms', RoomSchema);
var Persons = mongoose.model('Person',PersonDataSchema);

app.get('/spreadsheet', function (req, res) {
    var GoogleSpreadsheet = require("google-spreadsheet");
    
    
    // spreadsheet key is the long id in the sheets URL
    var doc = new GoogleSpreadsheet('1HaYrc6H9-EAKuCWDY6o0q2wGz91pH9JE57BYEYew844');
    var sheet1,sheet2,row1Count,row2Count;
    
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
                row1Count = sheet1.rowCount;
                row2Count= sheet2.rowCount;
                step( );
            });
        } ,
        function workingWithRows(step) {
            // google provides some query options
            
            sheet1.getCells({
                'min-row': 1, 
                'return-empty': false
            }, function (err, cells) {
                var jsonData = {};
                var i = 0;
                cells.forEach(function (entry) {
                    if (i == 0) {
                        jsonData['roomNumber'] = entry.value + "";
                         
                    } if (i == 1) {
                        jsonData['roomCapacity'] = entry.value;
                        
                    }
                    if (i == 2) {
                        jsonData['roomNotes'] = entry.value;
                         
                    }
                    i++;
                    if (i == 3) {
                        i = 0;
                        console.log('%j', jsonData);
                         
                        var saveDb = new Rooms(jsonData);
                        saveDb.save(function (err, save) {
                            if (err) {
                                console.log(err);
                            }
                           // console.log(save.roomNotes);
                        }); 
                       
                    }
                })
            }
            );
            
            
            
            
            
            

                
                sheet2.getCells({
                    'min-row': 1, 
                    'return-empty': false
                }, function (err, cells) {
                    var jsonData = {};
                    var i = 0;
                    cells.forEach(function (entry) {
                        if (i == 0) {
                            jsonData['Name'] = entry.value + "";
                            
      
                        } if (i == 1) {
                            jsonData['PhoneNumber'] = entry.value+"";
                            jsonData['occupied'] = 0 + "";
                        }
                         
                        i++;
                        if (i == 2) {
                            i = 0;
                            console.log('%j', jsonData);
                         
                            var saveDb = new Persons(jsonData);
                            saveDb.save(function (err, save) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log(save.PhoneNumber);
                            }); 
                       
                        }
                     
                    });
                
            })

        }

    ]);
    
    
    
    
    res.end();
});
 
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
