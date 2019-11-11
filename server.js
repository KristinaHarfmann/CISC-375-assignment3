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

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));
var port = 8000;


var users;
var members_filename = path.join(__dirname, 'users.JSON');
users = fs.readFile(members_filename, (err, data) => {
		if (err) {
			console.log('Error reading users.json');
			users = {};
		}
		else {
			users = JSON.parse(data);
		}
	});

app.get('/list-users', (req, res) => {
	//res.writeHead(200, {'Content-Type': 'text/plain'});
	//res.write(JSON.stringify(users, null, 4));
	//res.end();
	
	var limit = users.users.length;
	if(req.query.limit != undefined)
	{
		limit = req.query.limit;
	}
	
	var format = req.query.format;
	var data = { users: []};
	for (let i = 0; i < limit; i++)
	{
		data.users.push(users.users[i]);
	}
	
	if(format == 'xml')
	{
		var xml = js2xmlparser.parse("users", data);
		res.type('xml').send(xml);
	}
	else
	{
		res.type('json').send(data);
	}
});

app.put('/add-user', (req, res) => {
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
});

app.delete('/remove-user', (req, res) => {

	
	var remove_id;
	var has_id = false;
	for (let i = 0; i < users.users.length; i++)
	{
		if(users.users[i].id == req.body.id)
		{
			has_id = true;
			remove_id = i;
		}
	}

	if(!has_id)//if false
	{
		res.status(500).send("Error: user id doesn't exists");
	}
	else//if true
	{
		users.users.splice(remove_id, 1);

		fs.writeFile(members_filename, JSON.stringify(users, null, 4), (err) =>
		{
			res.status(200).send("Success!");
		});
	}
});

app.post('/update-user', (req, res) => {
		
	var update_id;
	var has_id = false;
	for (let i = 0; i < users.users.length; i++)
	{
		if(users.users[i].id == req.body.id)
		{
			has_id = true;
			update_id = i;
		}
	}

	if(!has_id)//if false
	{
		res.status(500).send("Error: user id doesn't exists");
	}
	else//if true
	{
		users.users[update_id].name = req.body.name;
		users.users[update_id].email = req.body.email;

		fs.writeFile(members_filename, JSON.stringify(users, null, 4), (err) =>
		{
			res.status(200).send("Success!");
		});
	}
});

	
app.listen(port);