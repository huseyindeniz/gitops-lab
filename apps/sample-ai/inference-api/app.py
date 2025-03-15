from pathlib import Path
from flask import Flask, jsonify, send_file
from dotenv import load_dotenv
from inference import process_image
from upload import upload_file
import os
from flask_cors import CORS

APP_ENV = os.getenv('FLASK_ENV', "development")
env_path = Path.cwd().joinpath(f'.env.{APP_ENV}')
if env_path.exists():
    load_dotenv(env_path)

app = Flask(__name__)

if(APP_ENV == "development" or APP_ENV == "docker"):
    app.config['DEBUG'] = True

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

app.config['RUN_ON_GPU'] = os.getenv('RUN_ON_GPU', '0')
app.config['MODELS_FOLDER'] = os.getenv('MODELS_FOLDER', 'models')
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['OUTPUT_FOLDER'] = os.getenv('OUTPUT_FOLDER', 'outputs')
app.config['ALLOWED_EXTENSIONS'] = os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg').split(',')

@app.route('/')
def home():
    return jsonify({"message": "Hello, Flask with ONNX!"})

@app.route('/upload', methods=['POST'])
def upload():
    return upload_file()

@app.route('/process/<filename>', methods=['POST'])
def process(filename):
    try:
        return send_file(process_image(filename), mimetype='image/png', download_name="test.png")
    except Exception as e:
        return jsonify({"error": f"Failed to process the image: {str(e)}"}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=app.config['DEBUG'])
