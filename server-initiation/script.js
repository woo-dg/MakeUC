// public/script.js


// Wait for the DOM to load before executing
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the dashboard page
  if (window.location.pathname.endsWith('/dashboard.html')) {
    // Fetch user data to display on the dashboard
    fetch('/session-data')
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          const user = data.user;
          const usernameElement = document.getElementById('username');
          if (usernameElement) {
            usernameElement.textContent = user.username;
          }


          // Get URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const saved = urlParams.get('saved');


          if (user.profile && user.profile.fullName) {
            // Populate profile summary
            document.getElementById('summary-fullName').textContent = user.profile.fullName;
            document.getElementById('summary-location').textContent = user.profile.location;
            document.getElementById('summary-skillsOffered').textContent = user.profile.skillsOffered;
            document.getElementById('summary-skillsWanted').textContent = user.profile.skillsWanted;
            document.getElementById('summary-availability').textContent = user.profile.availability;
            document.getElementById('summary-contactPreference').textContent = user.profile.contactPreference;
            document.getElementById('summary-bio').textContent = user.profile.bio;


            // Show profile summary and hide form
            const profileSummary = document.getElementById('profile-summary');
            const profileForm = document.getElementById('profile-form');
            if (profileSummary && profileForm) {
              profileSummary.style.display = 'block';
              profileForm.style.display = 'none';
            }


            // Show success message if profile was just saved
            if (saved === 'true') {
              const successMessage = document.getElementById('success-message');
              if (successMessage) {
                successMessage.style.display = 'block';
              }
            }
          } else {
            // Show form and hide profile summary
            const profileForm = document.getElementById('profile-form');
            const profileSummary = document.getElementById('profile-summary');
            if (profileForm && profileSummary) {
              profileForm.style.display = 'block';
              profileSummary.style.display = 'none';
            }


            // Populate form fields if profile data exists
            if (user.profile) {
              document.getElementById('fullName').value = user.profile.fullName || '';
              document.getElementById('location').value = user.profile.location || '';
              document.getElementById('skillsOffered').value = user.profile.skillsOffered || '';
              document.getElementById('skillsWanted').value = user.profile.skillsWanted || '';
              document.getElementById('availability').value = user.profile.availability || '';
              document.getElementById('contactPreference').value = user.profile.contactPreference || '';
              document.getElementById('bio').value = user.profile.bio || '';
            }
          }


          // Add event listener for edit button
          const editButton = document.getElementById('edit-profile-button');
          if (editButton) {
            editButton.addEventListener('click', () => {
              const profileForm = document.getElementById('profile-form');
              const profileSummary = document.getElementById('profile-summary');
              const successMessage = document.getElementById('success-message');


              if (profileForm && profileSummary) {
                profileForm.style.display = 'block';
                profileSummary.style.display = 'none';
              }


              // Hide success message when editing
              if (successMessage) {
                successMessage.style.display = 'none';
              }


              // Populate form fields with existing profile data
              document.getElementById('fullName').value = user.profile.fullName || '';
              document.getElementById('location').value = user.profile.location || '';
              document.getElementById('skillsOffered').value = user.profile.skillsOffered || '';
              document.getElementById('skillsWanted').value = user.profile.skillsWanted || '';
              document.getElementById('availability').value = user.profile.availability || '';
              document.getElementById('contactPreference').value = user.profile.contactPreference || '';
              document.getElementById('bio').value = user.profile.bio || '';
            });
          }
        } else {
          // If not logged in and on the dashboard page, redirect to login page
          window.location.href = '/login.html';
        }
      })
      .catch((error) => console.error('Error fetching session data:', error));
  }


  // Check if we're on the profiles page
  if (window.location.pathname.endsWith('/profiles.html')) {
    // Function to initialize the map with given coordinates
    function initializeMap(currentLat, currentLon) {
      // Initialize the map centered on the user's current location
      const map = L.map('map').setView([currentLat, currentLon], 13);


      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      }).addTo(map);


      // Add a marker for the current user
      const userIcon = L.icon({
        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });


      L.marker([currentLat, currentLon], { icon: userIcon })
        .addTo(map)
        .bindPopup('You are here')
        .openPopup();


      // Fetch profiles data with current location
      fetch(`/profiles?lat=${currentLat}&lon=${currentLon}`)
        .then((response) => {
          if (response.redirected) {
            // Redirect to login if not authenticated
            window.location.href = '/login.html';
          } else {
            return response.json();
          }
        })
        .then((data) => {
          if (data && data.profiles) {
            const profilesList = document.getElementById('profiles-list');
            if (profilesList) {
              if (data.profiles.length === 0) {
                profilesList.innerHTML = '<p>No neighbors found within a 5 km radius.</p>';
              } else {
                data.profiles.forEach((user) => {
                  const profileCard = document.createElement('div');
                  profileCard.className = 'profile-card';


                  profileCard.innerHTML = `
                    <h3>${user.profile.fullName}</h3>
                    <p><strong>Location:</strong> ${user.profile.location}</p>
                    <p><strong>Skills Offered:</strong> ${user.profile.skillsOffered}</p>
                    <p><strong>Skills Wanted:</strong> ${user.profile.skillsWanted}</p>
                    <p><strong>Availability:</strong> ${user.profile.availability}</p>
                    <p><strong>Contact Preference:</strong> ${user.profile.contactPreference}</p>
                    <p><strong>Bio:</strong> ${user.profile.bio}</p>
                  `;


                  profilesList.appendChild(profileCard);


                  // Add marker to the map for each nearby user
                  const marker = L.marker([user.profile.latitude, user.profile.longitude])
                    .addTo(map)
                    .bindPopup(
                      `<strong>${user.profile.fullName}</strong><br>${user.profile.skillsOffered}`
                    );
                });
              }
            }
          } else {
            console.error('No profiles data received.');
          }
        })
        .catch((error) => console.error('Error fetching profiles:', error));
    }


    // Check if geolocation is available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;
          initializeMap(currentLat, currentLon);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Handle location error (e.g., user denied access)
          alert('Unable to access your location. Using default location.');
          const currentLat = 43.6055; // Latitude of 50 Bristol Rd W, Mississauga, ON
          const currentLon = -79.6968; // Longitude of 50 Bristol Rd W, Mississauga, ON
          initializeMap(currentLat, currentLon);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Using default location.');
      const currentLat = 43.6055; // Latitude of 50 Bristol Rd W, Mississauga, ON
      const currentLon = -79.6968; // Longitude of 50 Bristol Rd W, Mississauga, ON
      initializeMap(currentLat, currentLon);
    }
  }


  // Existing code for other pages (if any)...
});



