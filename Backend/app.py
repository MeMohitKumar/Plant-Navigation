from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import json
import pandas as pd
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load trained model
model = load_model("mobilenet_model_compat.keras")

# Load label map
with open("label_map.json", "r") as f:
    label_map = json.load(f)
index_to_label = {v: k for k, v in label_map.items()}

# Load and process Excel file with plant locations
df = pd.read_excel("plant_locations.xlsx")
plant_location_map = {
    row["plant_name"]: {
        "latitude": float(str(row["Latitude"]).replace("°", "").strip()),
        "longitude": float(str(row["Longitude"]).replace("°", "").strip())
    }
    for _, row in df.iterrows()
}


# Set up upload folder
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected image"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    # Preprocess image
    img = image.load_img(filepath, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0

    # Predict
    prediction = model.predict(img_array)
    predicted_class = int(np.argmax(prediction[0]))
    predicted_label = index_to_label.get(predicted_class, "Unknown")

    # Get plant location from Excel mapping
    plant_location = plant_location_map.get(predicted_label, {"latitude": None, "longitude": None})

    return jsonify({
        "predicted_class": predicted_class,
        "predicted_label": predicted_label,
        "confidence": float(np.max(prediction[0])),
        "location": plant_location
    })

if __name__ == "__main__":
    app.run(debug=True)
