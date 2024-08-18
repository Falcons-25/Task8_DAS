from flask import Flask, render_template, jsonify, request
import serial
import logging
from datetime import datetime

app = Flask(__name__)

isPadaReleased = False
padaReleaseAlt = None
padaReleaseTime = None

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Attempt to open the serial port
try:
    ser = serial.Serial('COM8', 9600, timeout=1)
except serial.SerialException as e:
    logging.error(f"Serial port error: {e}")
    ser = None

# Store GPS data
time = []
gps_data = {'tracker1': [], 'tracker2': []}

def read_from_arduino():
    if ser and ser.in_waiting > 0:
        try:
            data = ser.readline().decode('utf-8').strip()
            parts = data.split(';')
            if len(parts) >= 12:
                try:
                    tracker1_data = {
                        'latitude': float(parts[1]),
                        'longitude': float(parts[2]),
                        'heading': float(parts[3]),
                        'altitude': float(parts[0]),
                        'speed': float(parts[4]),
                        'battery': float(parts[5]),
                        'pitch':float(parts[6]),
                        'bank_angle':float(parts[7]),
                        'number_of_circles':int(parts[8]),
                        'circles':[tuple(parts[9*i:9*(i+1)]) for i in range(1, len(parts)//9)],
                    }
                    tracker2_data = {   
                        'latitude': float(parts[1]),
                        'longitude': float(parts[2]),
                        'heading': float(parts[3]),
                        'altitude': float(parts[0]),
                        'speed': float(parts[4]),   
                        'battery': float(parts[5]),
                    }
                    
                    # Only add data if conversion was successful
                    gps_data['tracker1'].append(tracker1_data)
                    gps_data['tracker2'].append(tracker2_data)
                    
                except ValueError as ve:
                    logging.error(f"Value error during conversion: {ve}")
            return gps_data
        except Exception as e:
            logging.error(f"Error reading from serial port: {e}")
    return None

def get_current_time():
    return datetime.now().strftime('%H:%M:%S')

@app.route('/')
def index():    
    return render_template('index.html')

@app.route('/altitudegraph')
def altitude_graph():
    return render_template('altitudegraph.html')

@app.route('/data')
def data():
    data = read_from_arduino()
    current_time = get_current_time()
    if data:
        time.append(current_time)  # Store the timestamp
        response = {'timestamps': time, **data}
        return jsonify(response)
    return jsonify({'timestamps': time})

@app.route('/releasepada')
def releasepada():
    global isPadaReleased, padaReleaseAlt, padaReleaseTime
    isPadaReleased = True
    padaReleaseAlt = request.args.get('altitude', type=float)
    padaReleaseTime = request.args.get('time')
    print(padaReleaseAlt)
    print(padaReleaseTime)
    return jsonify(message="released", altitude=padaReleaseAlt,time=padaReleaseTime)

@app.route('/isPadaReleased')   
def isPadaReleased():
    global padaReleaseAlt, padaReleaseTime
    if isPadaReleased==True:
        return jsonify(altitude=padaReleaseAlt, time=padaReleaseTime)
    else:
        return jsonify(altitude=None, time=None)

if __name__ == '__main__':
    app.run(debug=False)
