import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
import torch.nn.functional as F
from tqdm import tqdm
from cnn_bilstm import CNNBiLSTM
from preprocess import TextTokenizer, normalize

SENT2ID = {"negative": 0, "neutral": 1, "positive": 2}

class ReviewDS(Dataset):
    def __init__(self, df: pd.DataFrame, tokenizer: TextTokenizer, max_len: int = 64):
        self.df = df
        self.tk = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.df)

    def __getitem__(self, i):
        row = self.df.iloc[i]
        x = torch.tensor(self.tk.encode(row["text"], self.max_len), dtype=torch.long)
        y = torch.tensor(SENT2ID.get(row["sentiment"], 1), dtype=torch.long)
        return x, y

def load_df(path: str):
    df = pd.read_csv(path)
    df["text"] = df["text"].astype(str).apply(normalize)
    return df

def train_model(csv_path: str, sp_model_path: str, vocab_size: int, out_path: str, epochs: int = 4, lr: float = 1e-3):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tokenizer = TextTokenizer(sp_model_path)
    df = load_df(csv_path)
    ds = ReviewDS(df, tokenizer)
    dl = DataLoader(ds, batch_size=32, shuffle=True)

    model = CNNBiLSTM(vocab_size=vocab_size).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=lr)

    for ep in range(1, epochs + 1):
        model.train()
        losses = []
        correct = 0
        total = 0
        for x, y in tqdm(dl, desc=f"Epoch {ep}"):
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = F.cross_entropy(logits, y)
            opt.zero_grad()
            loss.backward()
            opt.step()
            losses.append(loss.item())
            preds = logits.argmax(1)
            correct += (preds == y).sum().item()
            total += y.size(0)
        print(f"Epoch {ep} loss={sum(losses)/len(losses):.4f} acc={correct/total:.4f}")

    torch.save({"state_dict": model.state_dict()}, out_path)
    print("Saved model:", out_path)

if __name__ == "__main__":
    # Before running: train_tokenizer on a corpus to produce model file (e.g., corpus.txt → sp.model)
    # Example usage:
    # python train.py data/dataset_example.csv tokenizer/sp.model 8000 model/hybrid.pt
    import sys
    if len(sys.argv) < 5:
        print("Usage: python train.py <dataset.csv> <sp_model> <vocab_size> <out_model_path>")
        sys.exit(1)
    train_model(sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4])