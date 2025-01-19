from io import BytesIO
from pathlib import Path
from flask import Flask, jsonify, send_file
import torch
from dotenv import load_dotenv
from remove_background import inference
from upload import upload_file
import os
from flask_cors import CORS

APP_ENV = os.getenv('FLASK_ENV', "development")
env_path = Path.cwd().joinpath(f'.env.{APP_ENV}')
load_dotenv(env_path)

app = Flask(__name__)

CORS(app)

app.config['MODELS_FOLDER'] = os.getenv('MODELS_FOLDER', 'models')
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['OUTPUT_FOLDER'] = os.getenv('OUTPUT_FOLDER', 'outputs')
app.config['ALLOWED_EXTENSIONS'] = os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg').split(',')

@app.route('/')
def home():
    return jsonify({"message": "Hello, Flask with PyTorch!"})

@app.route('/gpu')
def check_gpu():
    if torch.cuda.is_available():
        return jsonify({"gpu": torch.cuda.get_device_name(0)})
    return jsonify({"gpu": "No GPU available"})

@app.route('/upload', methods=['POST'])
def upload():
    return upload_file()

@app.route('/process/<filename>', methods=['POST'])
def process_image(filename):
    try:
        # Process the image (remove background)
        # processed_image_path = remove_background(os.path.join(app.config['UPLOAD_FOLDER'],filename))
        image_path = os.path.join(app.config['UPLOAD_FOLDER'],filename)
        print(image_path)
        im_rgba = inference(image_path)
        print(type(im_rgba))
        im_rgba.save(os.path.join(app.config['OUTPUT_FOLDER'],filename), "PNG", quality=70)
        # Return the processed image
        # return send_from_directory(app.config['OUTPUT_FOLDER'], im_rgba)
        # response = make_response(im_rgba)
        # response.headers.set('Content-Type', 'image/png')
        # return response
        img_io = BytesIO()
        im_rgba.save(img_io, "PNG", quality=70)
        img_io.seek(0)
        return send_file(img_io, mimetype='image/png', download_name="test.png")
    except Exception as e:
        return jsonify({"error": f"Failed to process the image: {str(e)}"}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
