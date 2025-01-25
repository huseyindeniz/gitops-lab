import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

def check_env_vars():
    # List of environment variables to check
    env_vars = [
        "FLASK_ENV",
        "COMMAND",
        "PORT",
        "ALLOWED_EXTENSIONS",
        "MODELS_FOLDER",
        "UPLOAD_FOLDER",
        "OUTPUT_FOLDER"
    ]

    print("Checking environment variables and their values:\n")

    # Loop through environment variables and print them
    for var in env_vars:
        value = os.getenv(var, 'Not Set')
        print(f"{var}: {value}")

    print("\n")

def check_folders():
    # Check if folders exist
    folder_vars = ["MODELS_FOLDER", "UPLOAD_FOLDER", "OUTPUT_FOLDER"]
    print("Checking folder existence:\n")

    for var in folder_vars:
        folder_path = os.getenv(var)
        if folder_path:
            if os.path.isdir(folder_path):
                print(f"  Folder exists: {folder_path}")
            else:
                print(f"  Folder does not exist: {folder_path}")
        else:
            print(f"  {var} is not set.")


def check_model_file():
    # Check if 'isnet-general-use.pth' exists in the models folder
    models_folder = os.getenv("MODELS_FOLDER", 'models')
    pth_file_path = os.path.join(models_folder, 'isnet-general-use.pth')

    if os.path.isfile(pth_file_path):
        print(f"  The file '{pth_file_path}' exists.")
    else:
        print(f"  The file '{pth_file_path}' does not exist.")


if __name__ == "__main__":
    check_env_vars()
    check_folders()
    check_model_file()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
