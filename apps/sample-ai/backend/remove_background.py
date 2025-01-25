from io import BytesIO
import os
from pathlib import Path
from PIL import Image
from dotenv import load_dotenv
import numpy as np
import torch
from torch.autograd import Variable
from torchvision import transforms
import torch.nn.functional as F
from isnet import ISNetDIS
from flask import current_app

# project imports
from data_loader_cache import normalize, im_reader, im_preprocess

#Helpers
device = 'cuda' if torch.cuda.is_available() else 'cpu'

APP_ENV = os.getenv('FLASK_ENV', "development")
env_path = Path.cwd().joinpath(f'.env.{APP_ENV}')
if env_path.exists():
    load_dotenv(env_path)
    
class GOSNormalize(object):
    '''
    Normalize the Image using torch.transforms
    '''
    def __init__(self, mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]):
        self.mean = mean
        self.std = std

    def __call__(self,image):
        image = normalize(image,self.mean,self.std)
        return image


transform =  transforms.Compose([GOSNormalize([0.5,0.5,0.5],[1.0,1.0,1.0])])

def load_image(im_path, hypar):
    im = im_reader(im_path)
    im, im_shp = im_preprocess(im, hypar["cache_size"])
    im = torch.divide(im,255.0)
    shape = torch.from_numpy(np.array(im_shp))
    return transform(im).unsqueeze(0), shape.unsqueeze(0) # make a batch of image, shape


def build_model(hypar,device):
    net = hypar["model"]#GOSNETINC(3,1)

    # convert to half precision
    if(hypar["model_digit"]=="half"):
        net.half()
        for layer in net.modules():
            if isinstance(layer, F.BatchNorm2d):
                layer.float()

    net.to(device)

    if(hypar["restore_model"]!=""):
        net.load_state_dict(torch.load(
            os.path.join(hypar["model_path"],hypar["restore_model"])
            , map_location=device))
        net.to(device)
    net.eval()  
    return net

    
def predict(net, inputs_val, shapes_val, hypar, device):
    '''
    Given an Image, predict the mask
    '''
    net.eval()

    if(hypar["model_digit"]=="full"):
        inputs_val = inputs_val.type(torch.FloatTensor)
    else:
        inputs_val = inputs_val.type(torch.HalfTensor)

  
    inputs_val_v = Variable(inputs_val, requires_grad=False).to(device) # wrap inputs in Variable
   
    ds_val = net(inputs_val_v)[0] # list of 6 results

    pred_val = ds_val[0][0,:,:,:] # B x 1 x H x W    # we want the first one which is the most accurate prediction

    ## recover the prediction spatial size to the orignal image size
    pred_val = torch.squeeze(F.upsample(torch.unsqueeze(pred_val,0),(shapes_val[0][0],shapes_val[0][1]),mode='bilinear'))

    ma = torch.max(pred_val)
    mi = torch.min(pred_val)
    pred_val = (pred_val-mi)/(ma-mi) # max = 1

    if device == 'cuda': torch.cuda.empty_cache()
    return (pred_val.detach().cpu().numpy()*255).astype(np.uint8) # it is the mask we need

# Set parameters
hypar = {
    "model_path": os.getenv('MODELS_FOLDER', 'models'),
    "restore_model": "isnet-general-use.pth",
    "interm_sup": False,
    "model_digit": "full",
    "seed": 0,
    "cache_size": [1024, 1024],
    "input_size": [1024, 1024],
    "crop_size": [1024, 1024],
    "model": ISNetDIS(),
}

# Build the model
try:
    net = build_model(hypar, device)
except RuntimeError as e:
    net = None  # Ensure the app doesn't crash entirely
    current_app.logger.error(f"Critical error building model: {e}")


def inference(image):
  image_path = image
  
  image_tensor, orig_size = load_image(image_path, hypar) 
  mask = predict(net, image_tensor, orig_size, hypar, device)
  
  pil_mask = Image.fromarray(mask).convert('L')
  im_rgb = Image.open(image).convert("RGB")
  
  im_rgba = im_rgb.copy()
  im_rgba.putalpha(pil_mask)
  return im_rgba
  #return [im_rgba, pil_mask]

def process_image(filename):
    if not net:
        current_app.logger.error("Attempted to process an image without a loaded model.")
        return BytesIO()  # Return an empty response or handle gracefully
    try:
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'],filename)
        im_rgba = inference(image_path)
        im_rgba.save(os.path.join(current_app.config['OUTPUT_FOLDER'],filename), "PNG", quality=70)
        img_io = BytesIO()
        im_rgba.save(img_io, "PNG", quality=70)
        img_io.seek(0)
        return img_io
    except Exception as e:
        current_app.logger.error(f"Error processing image: {e}")
        return BytesIO()  # Return an empty response  