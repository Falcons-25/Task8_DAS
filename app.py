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

# Initialize serial connections
try:
    ser_tracker1 = serial.Serial('COM17', 9600, timeout=1)  # Port for tracker1 data
    ser_tracker2 = serial.Serial('COM8', 9600, timeout=1)  # Port for tracker2 data
except serial.SerialException as e:
    logging.error(f"Serial port error: {e}")
    ser_tracker1 = ser_tracker2 = None

# Store GPS data
time = []
gps_data = {'tracker1': [], 'tracker2': []}

def read_from_arduino():
    if ser_tracker1 and ser_tracker1.in_waiting > 0:
        try:
            data = ser_tracker1.readline().decode('utf-8').strip()
            print("Tracker1: " + data + "\n")
            parts = data.split(',')
            if len(parts) >= 9:
                try:
                    tracker1_data = {
                        'latitude': float(parts[1]),
                        'longitude': float(parts[2]),
                        'heading': float(parts[3]),
                        'altitude': float(parts[0]),
                        'speed': float(parts[4]),
                        'battery': float(parts[5]),
                        'pitch': float(parts[6]),
                        'bank_angle': float(parts[7]),
                        'number_of_circles': int(parts[8]),
                        'circles': [tuple(parts[9*i:9*(i+1)]) for i in range(1, len(parts)//9)],
                        'ok': True
                    }
                    gps_data['tracker1'].append(tracker1_data)
                except ValueError as ve:
                    logging.error(f"Value error during conversion for tracker1: {ve}")
        except Exception as e:
            logging.error(f"Error reading from tracker1: {e}")            

    if ser_tracker2 and ser_tracker2.in_waiting > 0:
        try:
            data = ser_tracker2.readline().decode('utf-8').strip()
            print("Tracker2: " + data + "\n")
            parts = data.split(',')
            if len(parts) >= 6:
                try:
                    tracker2_data = {
                        'latitude': float(parts[1]),
                        'longitude': float(parts[2]),
                        'heading': float(parts[3]),
                        'altitude': float(parts[0]),
                        'speed': float(parts[4]),
                        'battery': float(parts[5]),
                        'ok': True
                    }
                    gps_data['tracker2'].append(tracker2_data)
                except ValueError as ve:
                    logging.error(f"Value error during conversion for tracker2: {ve}")
        except Exception as e:
            logging.error(f"Error reading from tracker2: {e}")
    return gps_data

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
    
    tracker1_ok = data['tracker1'][-1]['ok'] if data['tracker1'] else False
    tracker2_ok = data['tracker2'][-1]['ok'] if data['tracker2'] else False

    if tracker1_ok and tracker2_ok:
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
    return jsonify(message="released", altitude=padaReleaseAlt, time=padaReleaseTime)

@app.route('/isPadaReleased')
def isPadaReleased():
    global padaReleaseAlt, padaReleaseTime
    if isPadaReleased==True:
        return jsonify(altitude=padaReleaseAlt, time=padaReleaseTime)
    else:
        return jsonify(altitude=None, time=None)

if __name__ == '__main__':
    app.run(debug=False)
