from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

from services.repo_service import clone_repository, cleanup_repository
from services.graph_service import analyze_dependencies
from services.ai_service import explain_architecture, explain_code

app = FastAPI(title="repoMesh API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    url: str

class Node(BaseModel):
    id: str
    label: str
    type: str  # file, directory
    size: Optional[int] = 0

class Edge(BaseModel):
    source: str
    target: str

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    architecture_explanation: Optional[str] = None

class FileContentRequest(BaseModel):
    repo_url: str
    file_path: str

class FileContentResponse(BaseModel):
    content: str

class ExplainCodeRequest(BaseModel):
    repo_url: str
    file_path: str

class ExplainCodeResponse(BaseModel):
    explanation: str

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {"message": "Welcome to repoMesh API"}

@app.post("/explain-code", response_model=ExplainCodeResponse)
async def api_explain_code(request: ExplainCodeRequest):
    repo_path = None
    try:
        repo_path = clone_repository(request.repo_url)
        full_path = os.path.join(repo_path, request.file_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        explanation = await explain_code(request.file_path, content)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if repo_path:
            cleanup_repository(repo_path)

@app.post("/file-content", response_model=FileContentResponse)
async def get_file_content(request: FileContentRequest):
    repo_path = None
    try:
        repo_path = clone_repository(request.repo_url)
        full_path = os.path.join(repo_path, request.file_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if repo_path:
            cleanup_repository(repo_path)

@app.post("/analyze", response_model=GraphData)
async def analyze_repo(request: RepoRequest):
    repo_path = None
    try:
        print(f"Analyzing repo: {request.url}")
        # Clone repository
        repo_path = clone_repository(request.url)
        print(f"Cloned to: {repo_path}")
        
        # Analyze dependencies
        graph_data = analyze_dependencies(repo_path)
        print(f"Analysis complete: {len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges")
        
        # Re-enable AI architecture analysis
        architecture_explanation = await explain_architecture(graph_data, request.url)
        
        return {
            "nodes": graph_data["nodes"],
            "edges": graph_data["edges"],
            "architecture_explanation": architecture_explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if repo_path:
            cleanup_repository(repo_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
