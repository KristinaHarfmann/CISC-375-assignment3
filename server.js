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
		
	var data = {};
	var format = req.query.format;
	var setId = "";
	var setCode = "";
	var setGrid = "";



	var dbString = "SELECT * FROM Incidents";
	//limit, end_date, start_date, id, code, grid
	
	
	if(req.query.id != undefined)
	{//set up ids
		var ids = req.query.id.split(",");
		var setId = "( neighborhood_number = " + ids[0];
		for(i = 1; i < ids.length; i++)
		{
			setId = setId + " OR neighborhood_number = " + ids[i];
		}
		setId = setId + ")";
	}
	
	if(req.query.code != undefined)
	{//set up codes
		var codes = req.query.code.split(",");
		setCode = "( code = " + codes[0];
		for(i = 1; i < codes.length; i++)
		{
			setCode = setCode + " OR code = " + codes[i];
		}
		setCode = setCode + ")";
	}
	
	if(req.query.grid != undefined)
	{//set up grids
		var grids = req.query.grid.split(",");
		setGrid = "( police_grid = " + grids[0];
		for(i = 1; i < grids.length; i++)
		{
			setGrid = setGrid + " OR police_grid = " + grids[i];
		}
		setGrid = setGrid + ")";
	}
	
	
	
	if(req.query.end_date != undefined)
	{//put in end date
		dbString = dbString + " WHERE date_time <= " + req.query.end_date;
	}
	
	if(req.query.start_date != undefined && req.query.end_date != undefined)
	{//put in start date
		dbString = dbString + " AND date_time >= " + req.query.start_date;
	}
	else if(req.query.start_date != undefined && req.query.end_date == undefined)
	{
		dbString = dbString + " WHERE date_time >= " + req.query.start_date;
	}
	
	
	if(req.query.id != undefined && (req.query.end_date != undefined || req.query.start_date != undefined))
	{//put in ids

		dbString = dbString + " AND " + setId;
	}
	else if(req.query.id != undefined && (req.query.end_date == undefined && req.query.start_date == undefined))
	{
		dbString = dbString + " WHERE " + setId;
	}
	
	
	if(req.query.code != undefined && (req.query.end_date != undefined || req.query.start_date != undefined || req.query.id != undefined))
	{//put in codes
		dbString = dbString + " AND " + setCode;
	}
	else if(req.query.code != undefined && (req.query.end_date == undefined && req.query.start_date == undefined && req.query.id == undefined))
	{
		dbString = dbString + " WHERE " + setCode;
	}
	
	if(req.query.grid != undefined && (req.query.end_date != undefined || req.query.start_date != undefined || req.query.id != undefined || req.query.grid != undefined))
	{//put in grids
		dbString = dbString + "AND " + setGrid;
	}
	else if(req.query.grid != undefined && (req.query.end_date == undefined && req.query.start_date == undefined && req.query.id == undefined && req.query.grid == undefined))
	{
		dbString = dbString + " WHERE " + setGrid;
	}
	
	dbString = dbString + " ORDER BY date_time DESC";
	
	
	if(req.query.limit != undefined)
	{//put in limit
		dbString = dbString + " LIMIT " + req.query.limit;
	}
	else if(req.query.limit == undefined)
	{
		dbString = dbString + " LIMIT 10000";
	}
	
	
	
	console.log(dbString);
	
	
	db.all(dbString, (err, rows) => {
		
		console.log(rows.length);
		for (i = 0; i < rows.length; i++)
		{
			var newIncident = "I" + rows[i].case_number;
			var newDate = rows[i].date_time.substring(0, 9);
			var newTime = rows[i].date_time.substring(11,19);
			
			console.log(rows[i].date_time);
			
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
		}//for
		
		if(format == 'xml')
		{
			var xml = js2xmlparser.parse("incidents", data);
			res.type('xml').send(xml);
		}
		else
		{
			res.type('json').send(data);
		}
			
	});
	

	
	
	
	
	
	
	
	
	//db call for each combination of options
	
	
	//no input
	/*if(req.query.limit == undefined && req.query.end_date == undefined && req.query.start_date == undefined && req.query.id == undefined && req.query.code == undefined && req.query.grid == undefined)
	{
		
		db.all("SELECT top ? * Incidents ORDER BY date_time desc", 10000, (err, rows) => {
			
				
			for (i = 0; i < rows.length; i++)
			{
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
			}//for
			
		});//db.all
	}
	
	//only limit input
	if(req.query.limit != undefined && req.query.end_date == undefined && req.query.start_date == undefined && req.query.id == undefined && req.query.code == undefined && req.query.grid == undefined)
	{
		db.all("SELECT * Incidents WHERE limit = ? ORDER BY date_time desc", req.query.limit, (err, rows) => {
			
		});
	}
	
	//only end_date input
	if(req.query.limit == undefined && req.query.end_date != undefined && req.query.start_date == undefined && req.query.id == undefined && req.query.code == undefined && req.query.grid == undefined)
	{
		db.all("SELECT * Incidents WHERE date_time <= ? ORDER BY date_time desc", req.query.end_date, (err, rows) => {
			
		});
	}
	
	//only start_date input
	if(req.query.limit == undefined && req.query.end_date == undefined && req.query.start_date != undefined && req.query.id == undefined && req.query.code == undefined && req.query.grid == undefined)
	{
		db.all("SELECT * Incidents WHERE date_time = ? ORDER BY date_time desc", req.query.start_date, (err, rows) => {
			
		});
	}

	//only id input
	if(req.query.limit == undefined && req.query.end_date == undefined && req.query.start_date == undefined && req.query.id != undefined && req.query.code == undefined && req.query.grid == undefined)
	{
		db.all("SELECT * Incidents WHERE neighborhood_number = ? ORDER BY date_time desc", req.query.id, (err, rows) => {
			
		});
	}

	//only code input
	if(req.query.limit == undefined && req.query.end_date == undefined && req.query.start_date == undefined && req.query.id == undefined && req.query.code != undefined && req.query.grid == undefined)
	{
		db.all("SELECT * Incidents WHERE code = ? ORDER BY date_time desc", req.query.code, (err, rows) => {
			
		});
	}

	//only grid input
	if(req.query.limit == undefined && req.query.end_date == undefined && req.query.start_date == undefined && req.query.id == undefined && req.query.code == undefined && req.query.grid != undefined)
	{
		db.all("SELECT * Incidents WHERE police_grid = ? ORDER BY date_time desc", req.query.grid, (err, rows) => {
			
		});
	}	
	
	
	
	
	
	
	
	
	db.all("SELECT * FROM Incidents ORDER BY date_time desc", (err, rows) => {

		
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
		}
					
					
			

		for (i = 0; i < rows.length; i++)
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
		}
		
	*/
	
	//});//db.all
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