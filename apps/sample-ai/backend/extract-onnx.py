import torch
import torch.onnx
from isnet import ISNetDIS  # Assuming this is your model class

# Load the pre-trained model from the .pth file
def load_model():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")
    model = ISNetDIS()  # Define the model class (should match the one used in your original code)
    
    # Assuming you have the model saved in a file like 'models/isnet-general-use.pth'
    model_path = 'D:/volumes/shared/sample-ai-backend/models/isnet-general-use.pth'
    
    # Load the model's state_dict (weights)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)  # Move the model to the correct device (CPU or GPU)
    model.eval()  # Set the model to evaluation mode
    return model

# Export the model to ONNX format
def export_model_to_onnx(model):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # Create a dummy input to trace the model (example input size that matches your model)
    # The input tensor must support variable height and width
    dummy_input = torch.randn(1, 3, 1024, 1024).to(device)  # Example dummy input (batch_size=1, 3 channels, 1024x1024 image)
    
    # Export the model to ONNX format
    onnx_model_path = 'D:/volumes/shared/sample-ai-backend/models/model.onnx'
    torch.onnx.export(model,               # model being run
                      dummy_input,        # model input (or a tuple for multiple inputs)
                      onnx_model_path,    # where to save the model
                      export_params=True, # store the trained parameter weights inside the model file
                      opset_version=16,   # the ONNX version to export the model to
                      do_constant_folding=True,  # whether to execute constant folding for optimization
                      input_names=['input'],   # the input names for the model
                      output_names=['output'], # the output names for the model
                      dynamic_axes={'input': {0: 'batch_size', 2: 'height', 3: 'width'},    # Allow variable batch size, height, width
                                    'output': {0: 'batch_size'}})
    
    print(f"Model has been exported to ONNX format and saved as '{onnx_model_path}'")

if __name__ == "__main__":
    # Load the model and export it to ONNX
    model = load_model()
    export_model_to_onnx(model)
