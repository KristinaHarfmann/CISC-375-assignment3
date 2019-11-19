//curl http://localhost:8000/list-users
//curl -X PUT -d "id=3&name=Hello World&email=hw@code.org" http://localhost:8000/add-user
//curl -X DELETE -d "id=3" http://localhost:8000/remove-user
//curl -X POST -d "id=12&name=Update&email=update@hello" http://localhost:8000/update-user
//curl "http://localhost:8000/list-users?limit=3&format=xml"

var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var js2xmlparser = require("js2xmlparser");
var sqlite3 = require('sqlite3');
var cors = require('cors');

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));
var port = 8000;
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});


app.use(cors());

app.get('/codes', (req, res) => {
	db.all("SELECT * FROM Codes ORDER BY code", (err, rows) => {
		var data = {};
		var format = req.query.format;
		
		if(req.query.code != undefined)
		{
			var codes = req.query.code.split(",");

			for(i = 0; i < rows.length; i++)
			{
				if(codes.includes(rows[i].code.toString()))
				{
					var newCode = "C" + rows[i].code;
					data[newCode] = rows[i].incident_type;
				}
			}
		}
		else 
		{
			for (i = 0; i < rows.length; i++)
			{
				var newCode = "C" + rows[i].code;
				data[newCode] = rows[i].incident_type;
			}
		}
		
		if(format == 'xml')
		{
			var xml = js2xmlparser.parse("codes", data);
			res.type('xml').send(xml);
		}
		else
		{
			res.type('json').send(data);
		}
	});//db.all
});

app.get('/neighborhoods', (req, res) => {
	db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, rows) => {
		var data = { };
		var format = req.query.format;
		
		if(req.query.id != undefined)
		{
			var ids = req.query.id.split(",");

			for(i = 0; i < rows.length; i++)
			{
				if(ids.includes(rows[i].neighborhood_number.toString()))
				{
					//console.log("list ids = " + ids[i]);
					//console.log("rows = " + rows[j].neighborhood_number);

					var newNeigh = "N" + rows[i].neighborhood_number;
					data[newNeigh] = rows[i].neighborhood_name;
				}
				
			}
		}
		else
		{
			for (i = 0; i < rows.length; i++)
			{
				var newNeigh = "N" + rows[i].neighborhood_number;
				data[newNeigh] = rows[i].neighborhood_name;
			}
		}
		
		if(format == 'xml')
		{
			var xml = js2xmlparser.parse("neighborhoods", data);
			res.type('xml').send(xml);
		}
		else
		{
			res.type('json').send(data);
		}
	});//db.all
});

app.get('/incidents', (req, res) => {
	db.all("SELECT * FROM Incidents ORDER BY date_time desc", (err, rows) => {
		var data = {};
		var endDate = "2019-12-30";
		var startDate = "2014-08-1";
		var limit = 10000;
		var format = req.query.format;
		
		if(req.query.limit != undefined){
			limit = req.query.limit;
		}
		
		
		
		if(req.query.start_date != undefined){
			startDate = req.query.start_date;
			
		} 
		if(req.query.end_date != undefined){
			endDate = req.query.end_date;
			
		}
			
		
		if(req.query.code != undefined){
			var codes = req.query.code.split(",");
			for (i = 0; i < limit; i++){
								
					var newIncident = "I" + rows[i].case_number;
					var newDate = rows[i].date_time.substring(0, 9);
					var newTime = rows[i].date_time.substring(11);
					
				if(codes.includes(rows[i].code.toString()) && (newDate >= startDate && newDate <= endDate)){
					
			
					data[newIncident] = 
					{ 
						date : newDate,
						time : newTime,
						code : rows[i].code, 
						incident : rows[i].incident, 
						police_grid : rows[i].police_grid, 
						neighborhood_number : rows[i].neighborhood_number, 
						block : rows[i].block
					};
				}
			}
					
					
			

		/*for (i = 0; i < rows.length; i++)
		{
			var newIncident = "I" + rows[i].case_number;
			var newDate = rows[i].date_time.substring(0, 9);
			var newTime = rows[i].date_time.substring(11);
			data[newIncident] = 
			{ 
				date : newDate,
				time : newTime,
				code : rows[i].code, 
				incident : rows[i].incident, 
				police_grid : rows[i].police_grid, 
				neighborhood_number : rows[i].neighborhood_number, 
				block : rows[i].block
			};
		}*/
		
		
		
		if(format == 'xml')
		{
			var xml = js2xmlparser.parse("incidents", data);
			res.type('xml').send(xml);
		}
		else
		{
			res.type('json').send(data);
		}
	});//db.all
});

app.put('/new-incident', (req, res) => {
	db.all("SELECT * FROM Incidents ORDER BY date_time", (err, rows) => {
		var newCase = req.body.case_number;
		var newDateTime = req.body.date + "T" + req.body.time;
		var newCode = req.body.code;
		var newIncident = req.body.incident;
		var newGrid = req.body.police_grid;
		var newNeigh = req.body.neighborhood_number;
		var newBlock = req.body.block;

		var has_id = false;
		for (let i = 0; i < rows.length; i++)
		{
			//console.log("list = " + rows[i].case_number);
			//console.log("new case = " + req.body.case_number);
			if(rows[i].case_number == req.body.case_number)
			{
				has_id = true;
			}
		}
		
		if(has_id)
		{
			res.status(500).send("Error: incident case number already exists");
		}
		else
		{
			//(case_number, date_time, code, incident, police_grid, neighborhood_number, block)
			db.run('INSERT INTO Incidents VALUES(?,?,?,?,?,?,?)', newCase, newDateTime, newCode, newIncident, newGrid, newNeigh, newBlock, (err) =>
			{
				res.status(200).send("Success!");
			});

		}
	});
	//curl -X PUT -d "case_number=2&date=2019-11-12&time=20:14:13&incident=Theft&police_grid=2&neighborhood_number=12&block=3" http://localhost:8000/new-incident
});


app.listen(port);