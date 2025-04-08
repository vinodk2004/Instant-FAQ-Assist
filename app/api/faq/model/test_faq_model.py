# test_faq_model.py
import json
import torch
import numpy as np
import pickle
from faq_model_utils import Vocab, SiameseNetwork, clean_text, encode_text, cosine_sim, pad_sequence

import difflib

NORMALIZED_PHRASES = {
    "hi": "hi",
    "hello": "hi",
    "hey": "hi",
    "good morning": "hi",
    "good afternoon": "hi",
    "good evening": "hi",
    "help":"hi",
    "thanks": "thanks",
    "thank you": "thanks",
    "thank u": "thanks",
    "okay": "okay",
    "ok": "okay",
    "fine": "okay",
    "alright": "okay",
    "sure": "okay",
    "cool": "okay",
    "bye": "bye",
    "goodbye": "bye",
    "see you": "bye",
    "see ya": "bye",
    "later": "bye",
    "welcome": "thanks",
    "no problem": "thanks",
    "np": "thanks"
}

SMALL_TALK_RESPONSES = {
    "hi": "Hello. How may I assist you today?",
    "thanks": "You're welcome. Please let me know if you need further assistance.",
    "okay": "Noted. Let me know if you have any other questions.",
    "bye": "Thank you for reaching out. Have a great day."
}

def check_small_talk(user_input):
    text = clean_text(user_input).strip().lower()
    
    # Exact match
    if text in NORMALIZED_PHRASES:
        key = NORMALIZED_PHRASES[text]
        return SMALL_TALK_RESPONSES[key]

    # Optional: Fuzzy match for very close inputs
    close_match = difflib.get_close_matches(text, NORMALIZED_PHRASES.keys(), n=1, cutoff=0.75)
    if close_match:
        key = NORMALIZED_PHRASES[close_match[0]]
        return SMALL_TALK_RESPONSES[key]

    return None


# --- Main Test Script ---
def encode_text(model, text, vocab, max_len, device='cpu'):
    model.eval()
    with torch.no_grad():
        encoded = pad_sequence(vocab.encode(text), max_len)
        seq_tensor = torch.tensor([encoded], dtype=torch.long).to(device)
        embedding = model.forward_once(seq_tensor)
    return embedding.cpu().numpy()[0]

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    with open("vocab.pkl", "rb") as f:
        vocab = pickle.load(f)
    with open("faq_data.json", "r", encoding="utf-8") as f:
        faq_data = json.load(f)
    faq_embeddings = np.load("faq_embeddings.npy")

    max_len = max(len(item['question'].split()) for item in faq_data) + 2
    model = SiameseNetwork(len(vocab), 50, 64).to(device)
    model.load_state_dict(torch.load("siamese_faq_model.pt", map_location=device))

    print("\nSemantic FAQ Chatbot Ready. Type your question. Type 'exit' to quit.\n")
    while True:
        query = input("You: ")
        if query.lower() in ['exit', 'quit']:
            break

        # Step 1: Check for small talk
        small_talk_response = check_small_talk(query)
        if small_talk_response:
            print(f"Chatbot: {small_talk_response}")
            continue

        # Step 2: Semantic FAQ Matching
        cleaned = clean_text(query)
        query_emb = encode_text(model, cleaned, vocab, max_len, device)
        sims = [cosine_sim(query_emb, emb) for emb in faq_embeddings]
        best_idx = int(np.argmax(sims))
        best_score = sims[best_idx]

        if best_score < 0.6:
            print("Chatbot: I'm not confident in my answer. Forwarding to helpdesk.")
        else:
            print(f"Chatbot: {faq_data[best_idx]['answer']} (Confidence: {best_score:.2f})")

if __name__ == '__main__':
    main()
