import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration, AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F
import gc
import logging

# Setup logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Globals
t5_model = None
t5_tokenizer = None
roberta_model = None
roberta_tokenizer = None
MAX_INPUT_LENGTH = 512
LABELS = ["Negative", "Neutral", "Positive"]

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
        )
        logger.info("T5 model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load T5 model: {e}", exc_info=True)

    try:
        logger.info("Loading RoBERTa sentiment model...")
        roberta_tokenizer = AutoTokenizer.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")
        roberta_model = AutoModelForSequenceClassification.from_pretrained(
            "cardiffnlp/twitter-roberta-base-sentiment",
            low_cpu_mem_usage=True
        )
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
        optimize_memory()
        inputs = t5_tokenizer(
            "summarize: " + text,
            return_tensors="pt",
            max_length=MAX_INPUT_LENGTH,
            truncation=True
        )
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
        return summary
    except Exception as e:
        logger.error(f"Summarization error: {e}", exc_info=True)
        return text[:150] + "..." if len(text) > 150 else text

def analyze_sentiment(text):
    if not text or len(text) < 5:
        return {"label": "Neutral", "confidence": 1.0}

    if roberta_model is None or roberta_tokenizer is None:
        logger.warning("RoBERTa model/tokenizer not loaded.")
        return {"label": "Neutral", "confidence": 0.5}

    try:
        optimize_memory()
        inputs = roberta_tokenizer(
            text,
            return_tensors="pt",
            max_length=256,
            truncation=True,
            padding='max_length'
        )
        with torch.no_grad():
            outputs = roberta_model(**inputs)
            scores = F.softmax(outputs.logits, dim=1)
            label_idx = torch.argmax(scores).item()
            confidence = scores[0][label_idx].item()

        return {
            "label": LABELS[label_idx],
            "confidence": round(confidence, 3)
        }

    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}", exc_info=True)
        return {"label": "Neutral", "confidence": 0.5}
