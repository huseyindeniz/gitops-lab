# export_model.py

import torch
from isnet import ISNetDIS  # Assuming this is your model class

# Load the pre-trained model from the .pth file
def load_model():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = ISNetDIS()  # Define the model class (should match the one used in your original code)
    
    # Assuming you have the model saved in a file like 'models/isnet-general-use.pth'
    model_path = '/mnt/d/volumes/shared/sample-ai-backend/models/isnet-general-use.pth'
    
    # Load the model's state_dict (weights)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)  # Move the model to the correct device (CPU or GPU)
    model.eval()  # Set the model to evaluation mode
    return model

# Export the model to TorchScript format
def export_model_to_torchscript(model):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # Create a dummy input to trace the model (example input size that matches your model)
    dummy_input = torch.randn(1, 3, 1024, 1024).to(device)  # Adjust shape as needed
    
    # Trace the model
    traced_model = torch.jit.trace(model, dummy_input)
    
    # Save the traced model to a file
    traced_model.save('/mnt/d/volumes/shared/sample-ai-backend/models/model_traced.pt')  # Save the TorchScript model
    
    print("Model has been exported to TorchScript format and saved as 'model_traced.pt'")

if __name__ == "__main__":
    # Load the model and export it
    model = load_model()
    export_model_to_torchscript(model)
