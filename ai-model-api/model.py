import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration, AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F
import gc
import logging
import time

# Setup logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Globals
t5_model = None
t5_tokenizer = None
roberta_model = None
roberta_tokenizer = None
MAX_INPUT_LENGTH = 512
LABELS = {
    0: "Negative",
    1: "Neutral",
    2: "Positive"
}
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def optimize_memory():
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()

def load_models():
    global t5_model, t5_tokenizer, roberta_model, roberta_tokenizer

    try:
        logger.info("Loading T5 summarization model...")
        t5_tokenizer = T5Tokenizer.from_pretrained("./t5_model")
        t5_model = T5ForConditionalGeneration.from_pretrained(
            "./t5_model",
            low_cpu_mem_usage=True,
            torch_dtype=torch.float32
        ).to(device)
        t5_model.eval()
        logger.info("T5 model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load T5 model: {e}", exc_info=True)

    try:
        logger.info("Loading RoBERTa sentiment model...")
        roberta_tokenizer = AutoTokenizer.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")
        roberta_model = AutoModelForSequenceClassification.from_pretrained(
            "cardiffnlp/twitter-roberta-base-sentiment",
            low_cpu_mem_usage=True
        ).to(device)
        roberta_model.eval()
        logger.info("RoBERTa model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load RoBERTa model: {e}", exc_info=True)

def summarize(text, max_length=100):
    if not text or len(text) < 10:
        return text

    if t5_model is None or t5_tokenizer is None:
        logger.warning("T5 model/tokenizer not loaded.")
        return text

    try:
        logger.info("Starting summarization process...")
        start_time = time.time()
        
        optimize_memory()
        inputs = t5_tokenizer(
            "summarize: " + text,
            return_tensors="pt",
            max_length=MAX_INPUT_LENGTH,
            truncation=True
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            summary_ids = t5_model.generate(
                inputs["input_ids"],
                max_length=max_length,
                min_length=30,
                length_penalty=2.0,
                num_beams=2,
                early_stopping=True
            )
        summary = t5_tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        end_time = time.time()
        logger.info(f"Summarization took {end_time - start_time:.2f} seconds")

        return summary
    except Exception as e:
        logger.error(f"Summarization error: {e}", exc_info=True)
        return text[:150] + "..." if len(text) > 150 else text

def analyze_sentiment(text):
    if not text or len(text) < 5:
        return {"negative": 0.33, "neutral": 0.33, "positive": 0.33}  # Returning equal probability for weak input

    if roberta_model is None or roberta_tokenizer is None:
        logger.warning("RoBERTa model/tokenizer not loaded.")
        return {"negative": 0.33, "neutral": 0.33, "positive": 0.33}  # Fallback case if model not loaded

    try:
        optimize_memory()
        inputs = roberta_tokenizer(
            text,
            return_tensors="pt",
            max_length=256,
            truncation=True,
            padding='max_length'
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = roberta_model(**inputs)
            scores = F.softmax(outputs.logits, dim=1)

        # Get the individual class probabilities
        negative_confidence = scores[0][0].item()  # Negative class score
        neutral_confidence = scores[0][1].item()   # Neutral class score
        positive_confidence = scores[0][2].item()  # Positive class score

        # Ensure we're returning a sentiment even if it's very weak
        if max(negative_confidence, neutral_confidence, positive_confidence) < 0.55:
            logger.warning(f"Weak confidence detected for all sentiments")

        return {
            "negative": round(negative_confidence, 3),
            "neutral": round(neutral_confidence, 3),
            "positive": round(positive_confidence, 3),
        }

    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}", exc_info=True)
        return {"negative": 0.33, "neutral": 0.33, "positive": 0.33}  # Default fallback

