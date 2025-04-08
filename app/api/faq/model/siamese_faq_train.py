# siamese_faq_train.py
from faq_model_utils import load_dataset, clean_text, Vocab, create_pairs, FAQPairsDataset, SiameseNetwork, encode_text, train_siamese
import torch
import torch.optim as optim
import numpy as np
import pickle
import json
from torch.utils.data import DataLoader


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    dataset_path = r'C:\Users\admin\Desktop\COLLEGE\SEM 6\NLP\PROJECT\Ecommerce_FAQ_Chatbot_dataset.json'  # Update path if needed
    faq_data = load_dataset(dataset_path)
    faq_questions = [clean_text(item['question']) for item in faq_data]

    vocab = Vocab()
    for q in faq_questions:
        vocab.add_sentence(q)

    max_len = max(len(q.split()) for q in faq_questions) + 2
    left, right, labels = create_pairs(faq_questions)

    dataset = FAQPairsDataset(left, right, labels, vocab, max_len)
    dataloader = DataLoader(dataset, batch_size=16, shuffle=True)

    model = SiameseNetwork(len(vocab), 50, 64).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    train_siamese(model, dataloader, optimizer, epochs=20, device=device)

    faq_embeddings = [encode_text(model, q, vocab, max_len, device) for q in faq_questions]
    faq_embeddings = np.array(faq_embeddings)

    # Save artifacts
    torch.save(model.state_dict(), "siamese_faq_model.pt")
    with open("vocab.pkl", "wb") as f:
        pickle.dump(vocab, f)
    with open("faq_data.json", "w", encoding="utf-8") as f:
        json.dump(faq_data, f, indent=4)
    np.save("faq_embeddings.npy", faq_embeddings)


if __name__ == "__main__":
    main()