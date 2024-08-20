#include <Arduino.h>

// Initial values
float altitude = 99;    // ft
float latitude = 37.7749; 
float longitude = -122.4194;
float heading = 5;      // degrees
float speed = 30;       // km/h
float battery = 8.4;    // volts

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
    speed += random(-1, 1);
    battery -= 0.01;

    // Print the telemetry data
    Serial.print(altitude); Serial.print(",");
    Serial.print(latitude, 6); Serial.print(",");
    Serial.print(longitude, 6); Serial.print(",");
    Serial.print(heading); Serial.print(",");
    Serial.print(speed); Serial.print(",");
    Serial.print(battery); 
    Serial.println(); // Newline for the next set of data
  }
}
