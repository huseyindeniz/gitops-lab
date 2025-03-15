import os
from werkzeug.utils import secure_filename
from flask import request, jsonify
from flask import request, jsonify, current_app
from PIL import Image

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
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        # Open the image using Pillow
        with Image.open(file_path) as img:
            # Get current image dimensions
            width, height = img.size
            
            # Resize if the image is larger than 1024x768, keeping the aspect ratio
            max_width = 1024
            max_height = 768
            
            if width > max_width or height > max_height:
                # Calculate the new dimensions maintaining the aspect ratio
                aspect_ratio = width / height
                if width > height:
                    new_width = max_width
                    new_height = int(new_width / aspect_ratio)
                else:
                    new_height = max_height
                    new_width = int(new_height * aspect_ratio)
                
                # Resize the image
                img = img.resize((new_width, new_height), Image.LANCZOS)
                # Save the resized image over the original file
                img.save(file_path)

        return jsonify({
            "message": f"{filename}"
        })
    else:
        return jsonify({"error": f"Invalid file format. Allowed formats: {current_app.config['ALLOWED_EXTENSIONS']}."})
