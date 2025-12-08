from flask import Flask, request, jsonify
from spacy_model import load_ner_model
from predict import process_query
import json

app = Flask(__name__)

# ---------- Load SpaCy once (FAST) ----------
print("Loading NLP model...")
nlp = load_ner_model()
print("Model loaded successfully!")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        print("Received:", data)

        if not data or "message" not in data:
            return jsonify({"error": "send a 'message' field"}), 400

        input_text = data["message"]

        # call your existing predict function
        prediction_raw = process_query(input_text, context=None)
        prediction_json = json.loads(prediction_raw)
        return jsonify({"status": "OK", "response": prediction_json})


    except Exception as e:
        return jsonify({"status": "ERROR", "error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({"msg": "Flask ML server running"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
