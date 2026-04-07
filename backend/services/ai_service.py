import os
import google.genai as genai
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    client = None

async def explain_code(file_path: str, code_content: str) -> Optional[str]:
    """Generates an AI explanation for the provided code content."""
    if not client:
        return "AI explanation unavailable (missing API key)."
    
    prompt = f"""Explain the following code file: {file_path}. 
    Provide a concise summary of its purpose, key functions, and dependencies.
    
    ```python
    {code_content}
    ```
    """
    
    try:
        response = await client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        print(f"AI Response received: {response.text[:100]}...")
        return response.text
    except Exception as e:
        return f"Failed to generate explanation: {str(e)}"

async def explain_architecture(graph_data: dict, repo_url: str) -> Optional[str]:
    """Generates an AI explanation of the system architecture based on graph data."""
    if not client:
        return "AI architecture analysis unavailable (missing API key)."
    
    # Extract nodes and edges
    nodes = graph_data['nodes']
    edges = graph_data['edges']
    
    # Create nodes list for the prompt
    nodes_list = [node['id'] for node in nodes]
    
    # Create edges list with proper format
    edges_list = [f"{edge['source']} -> {edge['target']}" for edge in edges]
    
    prompt = f"""
🚀 The "Architectural Layering & Onboarding" Master Prompt

Role: You are a Senior Static Analysis Architect and Technical Educator.

Input Data:

Repository URL: {repo_url}

Nodes List: {nodes_list} (The components/files)

Edges List: {edges_list} (The dependency/import paths)

Objective: Analyze the repository structure to create a "Point-to-Point" onboarding guide. Categorize every file into functional domains and identify the development type with percentage breakdown.

Development Type Classification:
- Web Development: Projects containing frontend, backend, and API components
- Other Development: Mobile apps, desktop apps, CLI tools, data science, ML, etc.

Categorization Rules:
- Frontend: Include all UI components, styles, client-side scripts, and web-specific hooks.
- Backend: Include server setups, controllers, models, database logic, and server-side business logic.
- API Logic: Specifically group files that handle external requests, REST endpoints, GraphQL, or internal routing bridges.
- Other: Include mobile app files, desktop app components, CLI tools, data processing scripts, ML models, etc.

Accuracy: Use only the file names provided in the Nodes list.

Flow: Ensure the execution_journey follows the logical direction of the Edges (Source -> Target).

Required JSON Output Format (Strict):
{{
  "project_overview": "A high-level summary of what this project does.",
  "development_type": "web_development or other_development",
  "domain_percentages": {{
    "frontend": 0.0,
    "backend": 0.0, 
    "api_logic": 0.0,
    "other": 0.0
  }},
  "start_point": "The single most important file a new developer should start with.",
  "functional_domains": {{
    "frontend": ["list", "of", "frontend", "files"],
    "backend": ["list", "of", "backend", "files"],
    "api_logic": ["list", "of", "api", "files"],
    "other": ["list", "of", "other", "files"]
  }},
  "execution_journey": [
    {{
      "step": 1,
      "file": "path/to/start/file",
      "domain": "frontend/backend/api_logic/other",
      "description": "What happens here and why it's the entry point"
    }},
    {{
      "step": 2,
      "file": "path/to/next/file",
      "domain": "frontend/backend/api_logic/other", 
      "description": "How this connects to the previous step"
    }}
  ],
  "key_dependencies": {{
    "critical_paths": ["Most important dependency chains"],
    "bottlenecks": ["Files that multiple components depend on"]
  }},
  "onboarding_recommendations": [
    "Specific advice for new developers",
    "Files to study first",
    "Common patterns to understand"
  ]
}}

Guidelines:
- Use the Edges to trace actual execution flow (Source -> Target)
- Categorize files strictly according to the rules above
- Calculate percentages based on file count in each domain
- Identify development type: "web_development" if frontend+backend+api are present, otherwise "other_development"
- Identify the single best starting point for a new developer
- RETURN ONLY THE RAW JSON OBJECT. NO MARKDOWN, NO CODE BLOCKS, NO LEADING OR TRAILING TEXT.
"""
    
    try:
        response = await client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        print(f"Architectural AI Response: {response.text[:100]}...")
        return response.text
    except Exception as e:
        return f"Failed to analyze architecture: {str(e)}"
