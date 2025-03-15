import onnxruntime as ort
import numpy as np
from PIL import Image
from io import BytesIO
from flask import current_app
import os

# Preprocess the image: Normalize and convert to the required shape
class GOSNormalize(object):
    def __init__(self, mean=[0.5, 0.5, 0.5], std=[1.0, 1.0, 1.0]):
        self.mean = mean
        self.std = std

    def __call__(self, image):
        # Normalize the image like you did in the original code
        return (image - self.mean) / self.std

# Load and preprocess the image for model input
def load_image(image_path):
    # Load image and ensure it is in RGB format
    im = Image.open(image_path).convert("RGB")
    
    # Convert the image to a numpy array
    im = np.array(im)

    # Normalize the image using GOSNormalize
    transform = GOSNormalize([0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
    im = transform(im)

    # Convert to float32 and reorder from HWC to CHW (Height, Width, Channels -> Channels, Height, Width)
    im = np.transpose(im, (2, 0, 1))  # Change shape from HWC to CHW
    im = im.astype(np.float32) / 255.0  # Normalize pixel values to [0, 1]
    
    # Get original image size for resizing later
    orig_size = np.array([im.shape[1], im.shape[2]])  # [Height, Width]
    
    print(f"Image loaded and preprocessed with shape: {im.shape}")
    
    return im, orig_size

# Perform inference with the ONNX model
def predict(session, image_tensor, orig_size):
    # ONNX model requires the image to be a 4D tensor (batch_size, channels, height, width)
    image_tensor = np.expand_dims(image_tensor, axis=0)  # Add batch dimension

    # Run inference with ONNX
    inputs = {session.get_inputs()[0].name: image_tensor}
    outputs = session.run(None, inputs)
    
    print(f"Model outputs shape: {outputs[0].shape}")
    
    pred_val = outputs[0][0]  # Get the output mask from the model's first output
    pred_val = np.squeeze(pred_val)  # Remove unnecessary dimensions (squeeze the batch and channel dimensions)

    # Resize the mask to the original image size (using simple numpy resizing)
    print(f"Resizing mask from shape {pred_val.shape} to {orig_size[0], orig_size[1]}")
    
    # Initialize the resized mask
    resized_mask = np.zeros((orig_size[0], orig_size[1]), dtype=np.float32)

    # Resize the mask: using nearest-neighbor resizing
    for i in range(orig_size[0]):
        for j in range(orig_size[1]):
            # Find the corresponding position in the original mask
            orig_i = int(i * pred_val.shape[0] / orig_size[0])
            orig_j = int(j * pred_val.shape[1] / orig_size[1])
            resized_mask[i, j] = pred_val[orig_i, orig_j]
    
    # Normalize the mask to [0, 1]
    ma = np.max(resized_mask)
    mi = np.min(resized_mask)
    resized_mask = (resized_mask - mi) / (ma - mi)

    print(f"Mask normalized and resized, shape: {resized_mask.shape}")
    
    return (resized_mask * 255).astype(np.uint8)  # Convert to 8-bit mask

# Inference function
def inference(session, image_path):
    # Load and preprocess the image
    image_tensor, orig_size = load_image(image_path)

    # Perform inference
    mask = predict(session, image_tensor, orig_size)
    
    # Post-process the mask (convert it to an image)
    pil_mask = Image.fromarray(mask).convert('L')
    im_rgb = Image.open(image_path).convert("RGB")
    
    # Combine the original image with the alpha channel from the mask
    im_rgba = im_rgb.copy()
    im_rgba.putalpha(pil_mask)
    
    print(f"Output image size: {im_rgba.size}")
    
    return im_rgba


def create_session(model_path):
    try:
        # Check if GPU is available and create session with GPU
        providers = ort.get_available_providers()
        if 'CUDAExecutionProvider' in providers:
            if current_app.config['RUN_ON_GPU'] == '1':
                session = ort.InferenceSession(model_path, providers=['CUDAExecutionProvider'])
                print("Using GPU for inference")
                return session
            else:
                print("GPU available, but RUN_ON_GPU is set to False. Falling back to CPU.")
                session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
                return session
        else:
            print("CUDAExecutionProvider not found, falling back to CPU.")
            session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            return session
    except ort.ORTException as e:
        # If there's a GPU-related error or memory issue, fall back to CPU
        print(f"Error with GPU session creation: {e}")
        print("Falling back to CPU.")
        # Fall back to CPU execution provider
        session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        return session
    
def process_image(filename):
    try:
        model_path = os.path.join(current_app.config['MODELS_FOLDER'], 'model.onnx')
        session = create_session(model_path)
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'],filename)
        im_rgba = inference(session, image_path)
        im_rgba.save(os.path.join(current_app.config['OUTPUT_FOLDER'],filename), "PNG", quality=70)
        img_io = BytesIO()
        im_rgba.save(img_io, "PNG", quality=70)
        img_io.seek(0)
        return img_io
    except Exception as e:
        current_app.logger.error(f"Error processing image: {e}")
        return BytesIO()  # Return an empty response