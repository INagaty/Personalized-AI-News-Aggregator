from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import logging
from model import load_models, summarize, analyze_sentiment
import time  # For time tracking

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

        logger.info("Starting summarization...")
        start_time = time.time()

        summary = summarize(text)

        end_time = time.time()
        logger.info(f"Summarization took {end_time - start_time:.2f} seconds")

        return jsonify({
            "summary": summary,
        })

    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Exception during processing: {e}\n{error_details}")
        return jsonify({
            "error": str(e),
            "summary": text[:150] + "..." if len(text) > 150 else text,
        }), 500


@app.route('/api/sentiment', methods=['POST'])
def sentiment_analysis():
    data = request.get_json()
    print(f"Received data: {data}")
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text is required", "sentiment": "", "negative": 0.33, "neutral": 0.33, "positive": 0.33}), 400

    try:
        sentiment_result = analyze_sentiment(text)

        return jsonify({
            "negative": sentiment_result["negative"],
            "neutral": sentiment_result["neutral"],
            "positive": sentiment_result["positive"],
        })

    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Sentiment analysis error: {e}\n{error_details}")
        return jsonify({
            "error": str(e),
            "negative": 0.33,
            "neutral": 0.33,
            "positive": 0.33,
        }), 500



@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    logger.info("Starting Flask API server...")
    app.run(host="0.0.0.0", port=5000, debug=False)
