// Initialize the map
var map = L.map("map").setView([0, 0], 2);
let storedCurrentTime;
const timeFormat = 'HH:mm:ss';
isPadaReleased();


L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

function createCustomIcon(iconUrl) {
  return L.icon({
    iconUrl: iconUrl,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [1, -34],
  });
}

var tracker1IconUrl = "https://img.icons8.com/?size=100&id=113260&format=png&color=40C057";
var tracker2IconUrl = "https://img.icons8.com/?size=100&id=113260&format=png&color=FA5252";
var ctx = document.getElementById("altitudeChart").getContext("2d");


var altitudeChart = new Chart(ctx, {
  type: "line",
  data: {
    datasets: [
      {
        label: 'Altitude', // Optional: label for the dataset
        data: [], // Actual data will be pushed here
        borderColor: "#86FF84", // Line color
        backgroundColor: 'rgba(134, 255, 132, 0.1)', // Gradient fill below the line
        fill: true, // Ensure the background color is used
        cubicInterpolationMode: 'monotone', // Smooth the peaks
        tension: 0.4 // Adjust the tension for smoothing effect
      },
    ],
  },
  options: {
    color: "white",
    animation: {
      duration: 1000, // Animation duration in milliseconds
      easing: 'easeInOutCube' // Easing function for animations
    },
    scales: {
      x: {
        color: "white",
        type: "time",
        position: "bottom",
        time: {
          parser: timeFormat,
          unit:'second',
          displayFormats: {
            second: 'HH:mm:ss'
          },
        },
        grid: {
          color: "#5D5D5D",
        },
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          callback: function (value) {
            const date = new Date(value);
            return `${date.getMinutes()}:${date.getSeconds()}`;
          },
        },
      },
      y: {
        color: "white",
        beginAtZero: true,
        grid: {
          color: "#5D5D5D",
        },
        title: {
          display: true,
          text: "Altitude",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  },
});

altitudeChart.data.datasets.push({
  label: 'Event Marker',
  data: [], // Event marker data
  borderColor: "#FF5733", // Color for the event marker
  backgroundColor: "rgba(255, 87, 51, 0.5)", // Marker color with transparency
  borderWidth: 2,
  pointRadius: 5,
  pointBackgroundColor: "#FF5733",
  pointBorderColor: "#FF5733"
});

altitudeChart.options.plugins.annotation = {
  annotations: {
    eventLine: {
      type: 'line',
      borderColor: 'rgba(255, 99, 132, 0.8)',
      borderWidth: 2,
      mode: 'vertical',
      value: null, // To be set dynamically
      scaleID: 'x',
    }
  }
};

var dataPoints1 = [];
var dataPoints2 = [];
var tracker1Coords = [];
var tracker2Coords = [];
var circles = [];
var padaReleaseAlt = null;
var padaReleaseTime = null;

// Variables to store extracted data
var tracker1Latitude, tracker1Longitude, tracker1Heading, tracker1Altitude, tracker1Speed, tracker1Battery, tracker1Pitch, tracker1BankAngle, tracker1NumberOfCircles, tracker1Circles;
var tracker2Latitude, tracker2Longitude, tracker2Heading, tracker2Altitude, tracker2Speed, tracker2Battery;

async function fetchDataAndUpdate() {
  try {
    const response = await fetch("/data");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Data received:", data);

    // Extracting the latest timestamp
    const timestamps = data.timestamps || [];
    storedCurrentTime = timestamps.length > 0 ? timestamps[timestamps.length - 1] : '';

    // Extracting data from the JSON response
    tracker1Coords = data.tracker1.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      heading: point.heading,
      altitude: point.altitude,
      speed: point.speed,
      battery: point.battery,
      pitch: point.pitch,
      bank_angle: point.bank_angle,
      number_of_circles: point.number_of_circles,
      circles: point.circles,
    }));
    tracker2Coords = data.tracker2.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      heading: point.heading,
      altitude: point.altitude,
      speed: point.speed,
      battery: point.battery,
    }));

    // Extracting individual variables
    tracker1Latitude = tracker1Coords[tracker1Coords.length - 1]?.latitude || 0;
    tracker1Longitude = tracker1Coords[tracker1Coords.length - 1]?.longitude || 0;
    tracker1Heading = tracker1Coords[tracker1Coords.length - 1]?.heading || 0;
    tracker1Altitude = tracker1Coords[tracker1Coords.length - 1]?.altitude || 0;
    tracker1Speed = tracker1Coords[tracker1Coords.length - 1]?.speed || 0;
    tracker1Battery = tracker1Coords[tracker1Coords.length - 1]?.battery || 0;
    tracker1Pitch = tracker1Coords[tracker1Coords.length - 1]?.pitch || 0;
    tracker1BankAngle = tracker1Coords[tracker1Coords.length - 1]?.bank_angle || 0;
    tracker1NumberOfCircles = tracker1Coords[tracker1Coords.length - 1]?.number_of_circles || 0;
    tracker1Circles = tracker1Coords[tracker1Coords.length - 1]?.circles || [];

    tracker2Latitude = tracker2Coords[tracker2Coords.length - 1]?.latitude || 0;
    tracker2Longitude = tracker2Coords[tracker2Coords.length - 1]?.longitude || 0;
    tracker2Heading = tracker2Coords[tracker2Coords.length - 1]?.heading || 0;
    tracker2Altitude = tracker2Coords[tracker2Coords.length - 1]?.altitude || 0;
    tracker2Speed = tracker2Coords[tracker2Coords.length - 1]?.speed || 0;
    tracker2Battery = tracker2Coords[tracker2Coords.length - 1]?.battery || 0;

    // console.log(circles);

    // Update Map
    plotPaths(tracker1Coords, tracker2Coords);

    // Update Graph
    updateChart(tracker1Altitude, storedCurrentTime);

    // Update Altitude Display
    updateText(tracker1Altitude, tracker2Altitude, tracker1Latitude, tracker1Longitude, tracker2Latitude, tracker2Longitude, tracker1Speed, tracker2Speed, tracker1Battery, tracker2Battery);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function plotPaths(tracker1Coords, tracker2Coords) {
  if (window.tracker1Marker) map.removeLayer(window.tracker1Marker);
  if (window.tracker2Marker) map.removeLayer(window.tracker2Marker);

  const tracker1LatLngs = tracker1Coords.map(coord => [coord.latitude, coord.longitude]);
  const tracker2LatLngs = tracker2Coords.map(coord => [coord.latitude, coord.longitude]);

  if (!window.tracker1Layer) {
    window.tracker1Layer = L.polyline(tracker1LatLngs, { color: "blue" }).addTo(map);
  } else {
    window.tracker1Layer.setLatLngs(tracker1LatLngs);
  }

  if (!window.tracker2Layer) {
    window.tracker2Layer = L.polyline(tracker2LatLngs, { color: "red" }).addTo(map);
  } else {
    window.tracker2Layer.setLatLngs(tracker2LatLngs);
  }

  const latestTracker1 = tracker1Coords[tracker1Coords.length - 1];
  window.tracker1Marker = L.marker([latestTracker1.latitude, latestTracker1.longitude], {
    icon: createCustomIcon(tracker1IconUrl),
    rotationAngle: latestTracker1.heading,
  }).addTo(map);

  const latestTracker2 = tracker2Coords[tracker2Coords.length - 1];
  window.tracker2Marker = L.marker([latestTracker2.latitude, latestTracker2.longitude], {
    icon: createCustomIcon(tracker2IconUrl),
    rotationAngle: latestTracker2.heading,
  }).addTo(map);
}

function updateChart(tracker1Altitude, storedCurrentTime) {
  const timestamp = toMs(storedCurrentTime);

  // Add new data point with the provided timestamp
  dataPoints1.push({ x: timestamp, y: tracker1Altitude });
  // console.log("Data Points 1: ", dataPoints1);

  // Maintain a 30-second window
  const thirtySecondsAgo = timestamp - 30000;
  while (dataPoints1.length && dataPoints1[0].x < thirtySecondsAgo) {
    dataPoints1.shift();
  }

  // Update chart data
  altitudeChart.data.datasets[0].data = dataPoints1;

  // Update chart view to maintain 30-second window
  const minX = dataPoints1.length ? dataPoints1[0].x : timestamp;
  const maxX = dataPoints1.length ? dataPoints1[dataPoints1.length - 1].x : timestamp;
  altitudeChart.options.scales.x.min = minX;
  altitudeChart.options.scales.x.max = maxX;

  // Update chart
  altitudeChart.update("none");
}

function updateEventMarker(xValue, yValue) {
  // Add or update marker data
  if (altitudeChart.data.datasets[1]) {
    altitudeChart.data.datasets[1].data = [{ x: xValue, y: yValue }];
  } else {
    altitudeChart.data.datasets.push({
      label: 'Event Marker',
      data: [{ x: xValue, y: yValue }],
      borderColor: "#FF5733",
      backgroundColor: "rgba(255, 87, 51, 0.5)",
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: "#FF5733",
      pointBorderColor: "#FF5733"
    });
  }
  altitudeChart.options.plugins.annotation.annotations.eventLine.value = xValue;

  altitudeChart.update();
}

function updateText(tracker1Altitude, tracker2Altitude, tracker1Latitude, tracker1Longitude, tracker2Latitude, tracker2Longitude, tracker1Speed, tracker2Speed, tracker1Battery, tracker2Battery, padaReleaseAlt) {
  document.getElementById("tracker1-altitude").innerText = `${tracker1Altitude}ft`;
  document.getElementById("gps1").innerText = `${tracker1Latitude}, ${tracker1Longitude}`;
  document.getElementById("gps2").innerText = `${tracker2Latitude}, ${tracker2Longitude}`;
  document.getElementById("bat1").innerText = `${tracker1Battery}`;
  document.getElementById("bat2").innerText = `${tracker2Battery}`;
  document.getElementById("speed1").innerText = `${tracker1Speed}`;
  document.getElementById("speed2").innerText = `${tracker2Speed}`;
  document.getElementById("alt2").innerText = `${tracker2Altitude}ft`;
} 

function openAltitudeGraphPage() {
  window.location.href = "/altitudegraph";
}

async function releasePada() {
  console.log("Pada released!");
  const releaseAlt = tracker1Altitude; // Local variable to avoid confusion
  console.log("Pada Release Altitude: ", releaseAlt);

  const response = await fetch(`/releasepada?altitude=${releaseAlt}&time=${storedCurrentTime}`);
  const resp = await response.json();
  // console.log(resp);

  // Update the event marker and vertical line
  updateEventMarker(toMs(storedCurrentTime), releaseAlt);
    
  isPadaReleased(); // Ensure this is called with the new altitude
  return releaseAlt;
  }

async function isPadaReleased() {
  const response = await fetch('/isPadaReleased');
  const resp = await response.json();
  // console.log(resp);
  if (resp.altitude !== null) {
    padaReleaseAlt=resp.altitude;
    padaReleaseTime=resp.time;
    console.log("Current Release Altitude: ", resp.altitude);
    disablePadaButton(resp.altitude, resp.time);
    updateEventMarker(toMs(resp.time), resp.altitude);
  } else {
    console.log("Error: ", resp.message);
    document.getElementById("padareleasealt").innerText='-';
  }
}

function disablePadaButton(padaReleaseAlt, padaReleaseTime) {
  if (padaReleaseAlt !== -99) {
    document.getElementById("padareleasealt").innerText = `${padaReleaseAlt}ft`;
    console.log("Release Time: ", padaReleaseTime);
    document.getElementById("release").innerText = `Released: ${padaReleaseTime}`;
    document.getElementById("release").disabled = true;
  } else {
    document.getElementById("padareleasealt").innerText = "-";
  }
} 

function toMs(timeString) {
  // Assume the timeString is in HH:mm:ss format
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a new Date object for the current date with the parsed time
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);

  // Return the timestamp in milliseconds
  return date.getTime();
}

function hsvToRgb(h, s, v) {
  let r, g, b;

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
  }

  return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
  };
}

// Add custom reset button control
L.Control.ResetButton = L.Control.extend({
  options: {
    position: 'topright'
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    var button = L.DomUtil.create('button', '', container);
    button.title = 'Reset Map View';
    button.innerHTML = '<img width="24" height="24" src="https://img.icons8.com/external-febrian-hidayat-basic-outline-febrian-hidayat/24/1A1A1A/external-bullseye-ui-essential-febrian-hidayat-basic-outline-febrian-hidayat"/>';

    L.DomEvent.on(button, 'click', this._onClick, this);

    return container;
  },

  _onClick: function () {
    if (tracker1Coords.length === 0 || tracker2Coords.length === 0) {
      return;
    }

    const tracker1LatLng = [tracker1Coords[tracker1Coords.length - 1].latitude, tracker1Coords[tracker1Coords.length - 1].longitude];
    const tracker2LatLng = [tracker2Coords[tracker2Coords.length - 1].latitude, tracker2Coords[tracker2Coords.length - 1].longitude];
    
    const bounds = L.latLngBounds([tracker1LatLng, tracker2LatLng]);
    
    map.fitBounds(bounds, { padding: [50, 50] });
  }
});

L.control.resetButton = function (opts) {
  return new L.Control.ResetButton(opts);
};

L.control.resetButton().addTo(map);

// Fetch data and update the map and chart
fetchDataAndUpdate();
setInterval(fetchDataAndUpdate, 1000);

// WebCam Setup
const fpvVideo = document.getElementById("fpv");

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      fpvVideo.srcObject = stream;
    })
    .catch(function (err) {
      console.error("Error accessing webcam:", err);
    });
} else {
  console.warn("getUserMedia not supported in this browser.");
}
