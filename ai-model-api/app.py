from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import logging
from model import load_models, summarize, analyze_sentiment

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load models once
load_models()

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text is required", "summary": ""}), 400

    try:
        logger.info(f"Received text of length {len(text)}")

        if len(text) < 30:
            logger.warning("Text too short to summarize")
            return jsonify({
                "summary": text,
                "sentiment": "Neutral",
                "confidence": 0.5,
                "note": "Text too short for summarization"
            })

        summary = summarize(text)
        sentiment_result = analyze_sentiment(summary)

        return jsonify({
            "summary": summary,
            "sentiment": sentiment_result["label"],
            "confidence": sentiment_result["confidence"]
        })

    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Exception during processing: {e}\n{error_details}")
        return jsonify({
            "error": str(e),
            "summary": text[:150] + "..." if len(text) > 150 else text,
            "sentiment": "Neutral",
            "confidence": 0.5
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    logger.info("Starting Flask API server...")
    app.run(host="0.0.0.0", port=5000, debug=True)
