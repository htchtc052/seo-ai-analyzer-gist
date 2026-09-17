import numpy as np
from fastapi import FastAPI
from gist import CosineDistance, LinearUtility, gist
from pydantic import BaseModel, model_validator

app = FastAPI()


class SelectRequest(BaseModel):
    vectors: list[list[float]]
    weights: list[float]
    k: int
    lam: float
    seed: int

    @model_validator(mode="after")
    def check_shapes(self) -> "SelectRequest":
        if len(self.vectors) != len(self.weights):
            raise ValueError("vectors and weights must have the same length")
        if not self.vectors:
            raise ValueError("vectors must not be empty")
        if self.k < 1:
            raise ValueError("k must be at least 1")
        return self


class SelectResponse(BaseModel):
    indices: list[int]
    objective: float
    utility: float
    diversity: float


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/select")
def select(request: SelectRequest) -> SelectResponse:
    result = gist(
        np.asarray(request.vectors, dtype=np.float64),
        LinearUtility(np.asarray(request.weights, dtype=np.float64)),
        CosineDistance(),
        k=request.k,
        lam=request.lam,
        seed=request.seed,
    )
    return SelectResponse(
        indices=result.indices.tolist(),
        objective=result.objective_value,
        utility=result.utility_value,
        diversity=result.diversity,
    )
