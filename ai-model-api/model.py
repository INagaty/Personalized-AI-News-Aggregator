from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch

# Load model and tokenizer
model_path = "./t5_model"
tokenizer = T5Tokenizer.from_pretrained(model_path)
model = T5ForConditionalGeneration.from_pretrained(model_path)

# Summarization function
def summarize(text, max_length=100):
    inputs = tokenizer("summarize: " + text, return_tensors="pt", truncation=True)
    summary_ids = model.generate(inputs["input_ids"], max_length=max_length, min_length=30, length_penalty=2.0, num_beams=4, early_stopping=True)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)
