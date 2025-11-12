# 🚀 Hinglish Sentiment Analysis System

## Introduction & Motivation

This system analyzes app reviews written in Hinglish (Hindi-English code-mixed text) using a hybrid approach combining lexicon-based sentiment analysis with deep learning models. With 500M+ Indians writing reviews in Hinglish, traditional English-only sentiment analyzers fail to capture user feedback accurately. Our solution scrapes Google Play Store reviews, normalizes Hinglish text (60+ word mappings), and performs aspect-based sentiment analysis to help developers understand user sentiment across features like payments, security, and performance.

## Features

- **Google Play Store Scraper**: Fetch reviews with pagination support (up to 1000+ reviews)
- **Hinglish Text Normalization**: 60+ word mappings (e.g., "bahut acha" → "very good", "bakwas" → "bad")
- **Sentiment Analysis**: Lexicon-based with negation handling, emoji detection, and booster words
- **Aspect-Based Analysis (ABSA)**: Extract sentiments for specific features (payments, security, QR scanner, etc.)
- **Hybrid Architecture**: TypeScript lexicon analyzer + Python CNN+BiLSTM model (optional)
- **Modern Web UI**: Real-time analysis with beautiful gradient interface

## Installation

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (optional, for ML model)
pip install -r requirements.txt
```

## Usage

```bash
# Development mode (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

The server will start at `http://localhost:3000`

## API Endpoints

### `POST /api/scrape`
Scrape and analyze app reviews from Google Play Store.

**Request:**
```json
{
  "platform": "play",
  "appId": "PhonePe",
  "max": 50,
  "useModel": false,
  "absa": true,
  "country": "in",
  "lang": "en"
}
```

**Response:**
```json
{
  "total": 50,
  "data": [
    {
      "id": 1,
      "text": "Bahut acha app! Fast UPI",
      "sentiment": "positive",
      "score": 0.85,
      "aspects": ["payments"]
    }
  ],
  "summary": {
    "total": 50,
    "positive": 35,
    "neutral": 10,
    "negative": 5,
    "positivePct": 70.0,
    "neutralPct": 20.0,
    "negativePct": 10.0,
    "overall": "positive"
  }
}
```

### `GET /health`
Health check endpoint.

## Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Modern gradient UI with glassmorphism

**Backend:**
- Node.js, TypeScript, Express.js
- google-play-scraper (v9.1.1)

**Analysis:**
- Lexicon-based sentiment analysis (TypeScript)
- CNN+BiLSTM model (Python, PyTorch) - Optional
- 60+ Hinglish word dictionary
- Emoji detection, negation handling

**Data Processing:**
- Text normalization (Hinglish → English)
- Tokenization & scoring
- Aspect extraction (10 categories)

## Directory Structure

```
capstone-Project/
├── public/              # Frontend files
│   ├── index.html       # UI
│   ├── app.js           # Frontend logic
│   └── style.css        # Modern styling
├── src/
│   ├── app.ts           # Express server
│   ├── scraper/         # Google Play scraper
│   │   ├── fetch-play-reviews.ts
│   │   └── resolve-app.ts
│   ├── utils/
│   │   └── sentiment.ts # Lexicon-based analyzer
│   ├── model/           # Python ML model
│   │   ├── infer.py     # Sentiment inference
│   │   ├── absa.py      # Aspect extraction
│   │   └── train.py     # Model training
│   └── types/
│       └── index.ts     # TypeScript types
├── package.json
├── tsconfig.json
└── requirements.txt
```

## Key Algorithms

### Hinglish Normalization
- Character repetition reduction: `aaaaaa` → `aa`
- Lexicon mapping: 60+ words (bahut → very, mast → great)
- Phrase combination: `not working` → `notworking`

### Sentiment Scoring
```typescript
score = (pos + α) / (pos + neg + 2α)  // Laplace smoothing (α=1)
```

### Features
- **Negation Detection**: 3-word context window with sentiment flipping
- **Booster Words**: "very", "so", "really" → 1.25x multiplier
- **Emoji Scoring**: 👍😊❤️ (+1.2), 👎😡💔 (-1.2)
- **Aspect Keywords**: Match 10 categories (payments, security, QR, etc.)

## Example Usage

```bash
# Analyze PhonePe reviews
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "play",
    "appId": "PhonePe",
    "max": 100,
    "absa": true
  }'
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License