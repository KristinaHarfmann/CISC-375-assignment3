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
var sqlite3 = require('sqlite3')

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));
var port = 8000;
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});



app.get('/codes', (req, res) => {
	db.all("SELECT * FROM Codes ORDER BY code", (err, rows) => {
		var data = {codes : [] };
		var line = "";
		for (i = 0; i < rows.length; i++)
		{
			line = rows[i].code + ' : ' + rows[i].incident_type; 
			data.codes.push(line);
		}
		res.type('json').send(data);
	});
});

app.get('/neighborhoods', (req, res) => {
	db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, rows) => {
		var data = {Neighborhood : [] };
		var line = "";
		for (i = 0; i < rows.length; i++)
		{
			line = rows[i].neighborhood_number + ' : ' + rows[i].neighborhood_name; 
			data.codes.push(line);
		}
		res.type('json').send(data);
	});
});

app.get('/incidents', (req, res) => {
	db.all("SELECT * FROM Incidents ORDER BY date_time", (err, rows) => {
		var data = {Incidents : [] };
		var line = "";
		for (i = 0; i < rows.length; i++)
		{
			line = rows[i].case_number + ' : ' + rows[i]; 
			data.codes.push(line);
		}
		res.type('json').send(data);
	});
});

app.put('/new-incident', (req, res) => {
	var new_user = {
		id: parseInt(req.body.id),
		name: req.body.name,
		email: req.body.email
	};
	var has_id = false;
	for (let i = 0; i < users.users.length; i++)
	{
		if(users.users[i].id === new_user.id)
		{
			has_id = true;
		}
	}
	if(has_id)
	{
		res.status(500).send("Error: user id already exists");
	}
	else
	{
		users.users.push(new_user);
		fs.writeFile(members_filename, JSON.stringify(users, null, 4), (err) =>
		{
			res.status(200).send("Success!");
		});
	}
	//sql.insert
	//db.run
});


app.listen(port);