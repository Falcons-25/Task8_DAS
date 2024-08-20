#include <Arduino.h>

// Initial values
float altitude = 99;    // ft
float latitude = 37.7749; 
float longitude = -122.4194;
float heading = 5;      // degrees
float speed = 30;       // km/h
float battery = 8.4;    // volts
float pitch = 10;       // degrees
float bank_angle = 15;  // degrees
int number_of_circles = 3; // Example initial number of circles

// Latitude and longitude variation for circles
const float latVariation = 0.001; // +/- 0.001 degrees
const float lonVariation = 0.001; // +/- 0.001 degrees

unsigned long previousMillis = 0;
const long interval = 1000;  // Interval at which to send data (milliseconds)

void setup() {
  Serial.begin(9600);
}

void loop() {
  unsigned long currentMillis = millis();

  // Check if a second has passed
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    // Slightly modify general values
    altitude += random(-5, 5);
    latitude += random(-5, 5) / 10000.0;
    longitude += random(-5, 5) / 10000.0;
    heading += random(-2, 2);
    speed += random(-1, 2);
    battery -= 0.01;
    pitch += random(-1, 2);
    bank_angle += random(-2, 3);
    number_of_circles = random(0, 5); // Random number of circles (0-4)

    // Print the telemetry data
    Serial.print(altitude); Serial.print(",");
    Serial.print(latitude, 6); Serial.print(",");
    Serial.print(longitude, 6); Serial.print(",");
    Serial.print(heading); Serial.print(",");
    Serial.print(speed); Serial.print(",");
    Serial.print(battery); Serial.print(",");
    Serial.print(pitch); Serial.print(",");
    Serial.print(bank_angle); Serial.print(",");
    Serial.print(number_of_circles);

    // Generate and print random data for each circle
    for (int i = 0; i < number_of_circles; i++) {
      float c1x = random(0, 1920) + random(0, 1000) / 1000.0;
      float c1y = random(0, 1080) + random(0, 1000) / 1000.0;
      float c1r = random(0, 100) + random(0, 1000) / 1000.0;
      float c1h = random(0, 360) + random(0, 1000) / 1000.0; // Hue (0-360)
      float c1s = random(0, 100) + random(0, 1000) / 1000.0; // Saturation (0-100)
      float c1v = random(0, 100) + random(0, 1000) / 1000.0; // Value (0-100)

      // Generate circle lat/lon close to main lat/lon
      float c1lat = latitude + random(-latVariation * 10000, latVariation * 10000) / 10000.0;
      float c1lon = longitude + random(-lonVariation * 10000, lonVariation * 10000) / 10000.0;

      int c1conf = random(0, 100); // Confidence (0-100)

      Serial.print(",");
      Serial.print(c1x); Serial.print(",");
      Serial.print(c1y); Serial.print(",");
      Serial.print(c1r); Serial.print(",");
      Serial.print(c1h); Serial.print(",");
      Serial.print(c1s); Serial.print(",");
      Serial.print(c1v); Serial.print(",");
      Serial.print(c1lat, 6); Serial.print(",");
      Serial.print(c1lon, 6); Serial.print(",");
      Serial.print(c1conf);
    }

    Serial.println(); // Newline for the next set of data
  }
}
