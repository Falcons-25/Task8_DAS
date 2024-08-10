
async function getDatapoints() {
  try {
    const response = await fetch('/data');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received Data:', data);


    const times = data.timestamps || [];
    const tracker1 = data.tracker1 || [];
    const altitudes = tracker1.map(item => item.altitude); 
    const dataPoints1 = times.map((time, index) => ({
      x: toMs(time),
      y: altitudes[index]
    }));
    return dataPoints1;
  } catch (error) {
    console.error('Error fetching and processing data:', error);
    return null;
  }
}

function toMs(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date.getTime();
}

async function updateChart() {
  const dataPoints = await getDatapoints();
  console.log('DataPoints:', dataPoints);

  if (dataPoints && dataPoints.length > 0) {
    if (!chart) {
      if (padaReleaseAlt==null) {
        createChart(dataPoints);
      } else {
        createChartwAnnotations(dataPoints,toMs(padaReleaseTime),padaReleaseAlt);
      }
    } else {
      // Update the existing chart
      chart.data.datasets[0].data = dataPoints;
      chart.update();
    }
    console.log('x:', dataPoints[dataPoints.length - 1].x);
    console.log('y:', dataPoints[dataPoints.length - 1].y);
  }
}

function createChart(dataPoints) {
  const ctx = document.getElementById('altitudeChart2').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Altitude',
        data: dataPoints,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        },
        borderColor: '#86FF84',
        backgroundColor: 'rgba(134, 255, 132, 0.1)',
        borderWidth: 1,
        fill: true,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }]
    },
    options: {
      color: "white",
      animation: {
        duration: 1000,
        easing: 'EaseInOutCube',
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second',
            tooltipFormat: 'HH:mm:ss',
            displayFormats: {
              second: 'HH:mm:ss'
            }
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Altitude'
          }
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        
      }
    }
  });
}

function createChartwAnnotations(dataPoints,ts,alt) {
  const ctx = document.getElementById('altitudeChart2').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Altitude',
        data: dataPoints,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        },
        borderColor: '#86FF84',
        backgroundColor: 'rgba(134, 255, 132, 0.1)',
        borderWidth: 1,
        fill: true,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }]
    },
    options: {
      color: "white",
      animation: {
        duration: 1000,
        easing: 'EaseInOutCube',
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second',
            tooltipFormat: 'HH:mm:ss',
            displayFormats: {
              second: 'HH:mm:ss'
            }
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Altitude'
          }
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              xMin: ts,
              xMax: ts,
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 2,
            },
            point1: {
              type: 'point',
              xValue: ts,
              yValue: alt,
              radius: 5,
              backgroundColor: 'rgba(255, 99, 132, 0.25)',
            }
          }
        }
      }
    }
  });
}

function openIndexPage() {
  window.location.href = "/";
}

async function isPadaReleased() {
  const response = await fetch('/isPadaReleased');
  const resp = await response.json();
  console.log(resp);
  if (resp.altitude !== null) {
    padaReleaseAlt = resp.altitude;
    padaReleaseTime = resp.time;
    console.log("Release Altitude: ", padaReleaseAlt);
    console.log("Release Time: ", padaReleaseTime);
    document.getElementById("btn5").innerText = 'Released';
    document.getElementById("btn6").innerText = `${padaReleaseAlt}ft \n${padaReleaseTime}`;
  } else {
    console.log("Pada not released");
    document.getElementById("btn5").innerText = 'Not Released';
    document.getElementById("btn6").innerText = '--';
  }
}


// main code, do once

const timeFormat = 'HH:mm:ss';
let chart; 
var padaReleaseAlt = null;
var padaReleaseTime = null;

isPadaReleased();
updateChart();
setInterval(updateChart, 1000); // Update the chart every second
