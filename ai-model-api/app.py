from flask import Flask, request, jsonify
from model import summarize
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    data = request.get_json()
    text = data.get("text", "")
    
    if not text:
        return jsonify({"error": "Text is required"}), 400

    try:
        summary = summarize(text)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)
