const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const app = express();
const session = require("express-session")
require('dotenv').config()

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = '';
var TOKEN = "";

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}))

var tokenStore = {}
function isAuthorized(userId) {
    console.log(tokenStore)
    console.log(userId)
    let res = tokenStore[userId] ? true : false
    return res
}


var redirect_uri = "http://localhost:3000/oauth-callback"
var auth_url = "https://app-eu1.hubspot.com/oauth/authorize?client_id=3d8ffc68-c84d-4bc6-9b05-26db48042426&redirect_uri=http://localhost:3000/oauth-callback&scope=crm.objects.contacts.write%20crm.schemas.custom.read%20crm.objects.custom.read%20crm.objects.custom.write%20oauth%20crm.objects.contacts.read"
// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

// * Code for Route 1 goes here
app.get('/', async (req, res) => {
    console.log(isAuthorized(req.sessionID))
    console.log(isAuthorized(req.sessionID) === true)
    if (isAuthorized(req.sessionID) === true) {
        const customObjectUrl = 'https://api.hubapi.com/crm/v3/objects/cars'; 
        const headers = {
            Authorization: `Bearer ${tokenStore[req.sessionID]}`,
            'Content-Type': 'application/json',
        };
        const params = {
            properties: ["name", "price", "fuel"]
        }

        try {
           
            const response = await axios.get(customObjectUrl, { 
                headers, 
                params, 
                paramsSerializer: {
                    indexes: null,
                } 
            });
            const cars = response.data.results;
            console.log(cars)
            
            res.render('homepage', { title: 'Custom Object Data | HubSpot Practicum', data: cars });
        } catch (error) {
            console.error('Error fetching custom object data:', error);
            res.status(500).send('Error fetching custom object data.');
        }
    } else {
        res.render('unauth', { auth_url });
    }
});

// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

app.get('/updatelist', async (req, res) => {
    if (isAuthorized(req.sessionID) === true) {
        const customObjectUrl = 'https://api.hubapi.com/crm/v3/objects/cars'; 
        const headers = {
            Authorization: `Bearer ${tokenStore[req.sessionID]}`,
            'Content-Type': 'application/json',
        };
        const params = {
            properties: ["name", "price", "fuel"]
        }

        try {
           
            const response = await axios.get(customObjectUrl, { 
                headers, 
                params, 
                paramsSerializer: {
                    indexes: null,
                } 
            });
            const cars = response.data.results; 

            
            res.render('updatelist', { title: 'Update Custom Object Form | HubSpot Practicum', data: cars });
        } catch (error) {
            console.error('Error fetching custom object data:', error);
            res.status(500).send('Error fetching custom object data.');
        }
    } else {
        res.render('unauth', { auth_url });
    }
});


// * Code for Route 2 goes here
app.get('/update', (req, res) => {
    console.log(req.query)
    res.render('update', { title: 'Update Custom Object Form | HubSpot Practicum', data: req.query });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

// * Code for Route 3 goes here
app.post('/update', async (req, res) => {

    console.log(req.body);
    var update = {
        properties: {
            "name": req.body.name,
            "price": req.body.price,
            "fuel": req.body.fuel
        }
    }
    const updateCar = `https://api.hubapi.com/crm/v3/objects/cars/${req.body.object_id}`;
    const headers = {
        Authorization: `Bearer ${tokenStore[req.sessionID]}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateCar, update, { headers } );
        res.redirect('/updatelist');
    } catch(err) {
        console.error(err);
    }

});

app.get("/oauth-callback", async (req, res) => {
    const request = {
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: redirect_uri,
        code: req.query.code
    }
    const response = await axios.post("https://api.hubspot.com/oauth/v1/token", querystring.stringify(request))
    console.log(response.data.access_token)
    TOKEN = response.data.access_token
    tokenStore[req.sessionID] = response.data.access_token;
    res.redirect("/")
    
})

app.get('/add', (req, res) => {
    console.log(req.query)
    
    res.render('add', { title: 'Create Custom Object Form | HubSpot Practicum', data: req.query });
});

app.post('/add', async (req, res) => {
    console.log(req.body);
    const newCar = {
        properties: {
            "name": req.body.name,
            "price": req.body.price,
            "fuel": req.body.fuel
        }
    };

    const createCarUrl = `https://api.hubapi.com/crm/v3/objects/cars`;
    const headers = {
        Authorization: `Bearer ${tokenStore[req.sessionID]}`,
        'Content-Type': 'application/json'
    };

    try {
        await axios.post(createCarUrl, newCar, { headers });
        res.redirect('/updatelist');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating car');
    }
});



// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));