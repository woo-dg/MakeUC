// server.js


const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
//const fetch = require('node-fetch'); // For geocoding


const app = express();


// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'your_secret_key', // Replace with a secure key in production
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static('public'));


// Simple user database
let users = [];


// Load users from data.json if it exists
if (fs.existsSync('data.json')) {
  const data = fs.readFileSync('data.json');
  users = JSON.parse(data);
}


// Helper function to save users to data.json
function saveUsers() {
  fs.writeFileSync('data.json', JSON.stringify(users, null, 2));
}


// Helper function to calculate distance between two coordinates (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  function toRad(Value) {
    return (Value * Math.PI) / 180;
  }


  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}


// Routes


// Registration Route
app.post('/register', (req, res) => {
  const { username, password } = req.body;


  // Check if user already exists
  if (users.find((user) => user.username === username)) {
    return res.send('User already exists. Please choose a different username.');
  }


  // Add user to the database with empty profile
  users.push({
    username,
    password,
    profile: {
      fullName: '',
      location: '',
      latitude: null,
      longitude: null,
      skillsOffered: '',
      skillsWanted: '',
      availability: '',
      contactPreference: '',
      bio: '',
    },
  });


  // Save users to data.json
  saveUsers();


  res.redirect('/login.html');
});


// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;


  // Authenticate user
  const user = users.find(
    (user) => user.username === username && user.password === password
  );


  if (user) {
    req.session.user = user;
    res.redirect('/dashboard.html');
  } else {
    res.send('Invalid credentials. Please try again.');
  }
});


// Save Profile Route
app.post('/save-profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }


  const {
    fullName,
    location,
    skillsOffered,
    skillsWanted,
    availability,
    contactPreference,
    bio,
  } = req.body;


  // Geocode the location to get latitude and longitude
  let latitude = null;
  let longitude = null;


  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      latitude = parseFloat(data[0].lat);
      longitude = parseFloat(data[0].lon);
    }
  } catch (error) {
    console.error('Error geocoding location:', error);
  }


  // Update user's profile
  users = users.map((user) => {
    if (user.username === req.session.user.username) {
      user.profile = {
        fullName,
        location,
        latitude,
        longitude,
        skillsOffered,
        skillsWanted,
        availability,
        contactPreference,
        bio,
      };
      req.session.user = user; // Update session data
    }
    return user;
  });


  // Save updated users to data.json
  saveUsers();


  // Redirect to dashboard with success query parameter
  res.redirect('/dashboard.html?saved=true');
});


// Session Data Route
app.get('/session-data', (req, res) => {
  if (req.session.user) {
    // Exclude password before sending
    const { password, ...userData } = req.session.user;
    res.json({ user: userData });
  } else {
    res.json({ user: null });
  }
});


// Profiles Route
app.get('/profiles', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }


  const { lat, lon } = req.query;


  if (!lat || !lon) {
    return res.status(400).send('Latitude and longitude are required.');
  }


  const currentUser = req.session.user;


  const currentLatitude = parseFloat(lat);
  const currentLongitude = parseFloat(lon);


  const nearbyUsers = users
    .filter((user) => {
      // Exclude self
      if (user.username === currentUser.username) return false;


      // Check if user has a valid location
      if (
        user.profile &&
        user.profile.latitude !== null &&
        user.profile.longitude !== null
      ) {
        const distance = calculateDistance(
          currentLatitude,
          currentLongitude,
          user.profile.latitude,
          user.profile.longitude
        );
        return distance <= 5; // Within 5 km radius
      }
      return false;
    })
    .map((user) => {
      // Exclude sensitive information
      const { password, ...safeUser } = user;
      return safeUser;
    });


  res.json({ profiles: nearbyUsers });
});


// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});



