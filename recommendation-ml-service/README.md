# Recommendation ML Service

Python microservice for the architecture behind `/recommendations`.

## Endpoints

- `GET /health`
- `POST /ml/train`
- `POST /ml/recommend`

## Run

```bash
cd recommendation-ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Spring backend is configured to call `http://localhost:5000/ml/recommend` by default.
