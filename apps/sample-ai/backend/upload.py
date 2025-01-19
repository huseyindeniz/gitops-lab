import os
from werkzeug.utils import secure_filename
from flask import request, jsonify
from flask import request, jsonify, current_app

# Check if the file has a valid extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

# Handle file upload
def upload_file():
    if 'image' not in request.files:
        return jsonify({"error": "No image part"})
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
        return jsonify({
            "message": f"{filename}"
        })
    else:
        return jsonify({"error": f"Invalid file format. Allowed formats: {current_app.config['ALLOWED_EXTENSIONS']}."})
