# faq_model_utils.py

import re
import random
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset
from nltk.corpus import stopwords, wordnet
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import difflib

# Ensure nltk data is downloaded only once
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

STOPWORDS = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

# === Text Processing ===

def clean_text(text):
    text = text.lower().strip()
    text = re.sub(r'\s+', ' ', text)
    tokens = word_tokenize(text)
    tokens = [t for t in tokens if t.isalnum()]
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in STOPWORDS]
    return ' '.join(tokens)

def get_synonym(word):
    syns = wordnet.synsets(word)
    if syns:
        lemmas = [lemma.name() for lemma in syns[0].lemmas() if lemma.name() != word]
        if lemmas:
            return random.choice(lemmas)
    return word

def augment_text(text):
    tokens = text.split()
    if len(tokens) < 4: return text
    idx = random.randint(0, len(tokens) - 1)
    tokens[idx] = get_synonym(tokens[idx])
    return ' '.join(tokens)

# === Vocabulary Class ===

class Vocab:
    def __init__(self):
        self.word2idx = {"<PAD>": 0, "<UNK>": 1}
        self.idx2word = {0: "<PAD>", 1: "<UNK>"}
        self.count = 2

    def add_sentence(self, sentence):
        for word in sentence.split():
            if word not in self.word2idx:
                self.word2idx[word] = self.count
                self.idx2word[self.count] = word
                self.count += 1

    def encode(self, sentence):
        return [self.word2idx.get(word, self.word2idx["<UNK>"]) for word in sentence.split()]

    def __len__(self):
        return self.count

# === Utility ===

def pad_sequence(seq, max_len):
    return seq + [0]*(max_len - len(seq)) if len(seq) < max_len else seq[:max_len]

def load_dataset(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get("questions", [])

def create_pairs(texts):
    left_texts, right_texts, labels = [], [], []
    for i in range(len(texts)):
        pos = texts[i]
        neg = random.choice([texts[j] for j in range(len(texts)) if j != i])
        aug = augment_text(pos)
        left_texts += [pos, pos]
        right_texts += [aug, neg]
        labels += [1, 0]
    return left_texts, right_texts, labels

# === Dataset ===

class FAQPairsDataset(Dataset):
    def __init__(self, left_texts, right_texts, labels, vocab, max_len):
        self.left_texts = left_texts
        self.right_texts = right_texts
        self.labels = labels
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        left_encoded = pad_sequence(self.vocab.encode(self.left_texts[idx]), self.max_len)
        right_encoded = pad_sequence(self.vocab.encode(self.right_texts[idx]), self.max_len)
        label = self.labels[idx]
        return torch.tensor(left_encoded), torch.tensor(right_encoded), torch.tensor(label, dtype=torch.float)

# === Model ===

class SiameseNetwork(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim):
        super(SiameseNetwork, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2 * 2, hidden_dim)

    def forward_once(self, x):
        embedded = self.embedding(x)
        output, _ = self.lstm(embedded)
        avg_pool = torch.mean(output, dim=1)
        max_pool, _ = torch.max(output, dim=1)
        concat = torch.cat((avg_pool, max_pool), dim=1)
        out = torch.relu(self.fc(concat))
        return nn.functional.normalize(out, p=2, dim=1)

    def forward(self, x1, x2):
        out1 = self.forward_once(x1)
        out2 = self.forward_once(x2)
        return nn.functional.cosine_similarity(out1, out2)

# === Training + Embedding ===

def contrastive_loss(y_pred, y_true, margin=0.5):
    loss_pos = y_true * (1 - y_pred).pow(2)
    loss_neg = (1 - y_true) * torch.clamp(y_pred - margin, min=0.0).pow(2)
    return torch.mean(loss_pos + loss_neg)

def train_siamese(model, dataloader, optimizer, epochs=20, device='cpu'):
    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        for left, right, labels in dataloader:
            left, right, labels = left.to(device), right.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(left, right)
            loss = contrastive_loss(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1}/{epochs} Loss: {total_loss/len(dataloader):.4f}")

def encode_text(model, text, vocab, max_len, device='cpu'):
    model.eval()
    with torch.no_grad():
        encoded = pad_sequence(vocab.encode(text), max_len)
        seq_tensor = torch.tensor([encoded], dtype=torch.long).to(device)
        embedding = model.forward_once(seq_tensor)
    return embedding.cpu().numpy()[0]

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

# === Small Talk Handling ===

NORMALIZED_PHRASES = {
    "hi": "hi",
    "hello": "hi",
    "hey": "hi",
    "good morning": "hi",
    "good afternoon": "hi",
    "good evening": "hi",
    "help": "hi",
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
