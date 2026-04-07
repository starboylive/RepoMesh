import os
import ast
import re
from typing import List, Dict, Set

def analyze_dependencies(repo_path: str) -> Dict:
    """Analyzes dependencies in the repository and returns nodes and edges."""
    nodes = []
    edges = []
    file_nodes = {}
    
    # Map file paths to node IDs
    file_nodes = {}
    structural_edges = []
    
    # First pass: Collect all files and directories to build the node map
    for root, dirs, files in os.walk(repo_path):
        if '.git' in dirs:
            dirs.remove('.git')
            
        # Add directory nodes
        rel_dir = os.path.relpath(root, repo_path)
        node_id = rel_dir if rel_dir != "." else "root"
        
        if node_id not in file_nodes:
            file_nodes[node_id] = {
                "id": node_id,
                "label": os.path.basename(root) if rel_dir != "." else os.path.basename(repo_path),
                "type": "directory",
                "size": 0
            }
            nodes.append(file_nodes[node_id])

        # Add parent-child relationship for directories
        if rel_dir != ".":
            parent_dir = os.path.dirname(rel_dir)
            parent_id = parent_dir if parent_dir != "." else "root"
            structural_edges.append({"source": parent_id, "target": node_id, "type": "structural"})

        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, repo_path)
            
            node_id = rel_path
            file_nodes[node_id] = {
                "id": node_id,
                "label": file,
                "type": "file",
                "size": os.path.getsize(file_path)
            }
            nodes.append(file_nodes[node_id])
            
            # Add structural edge from parent folder to file
            parent_id = rel_dir if rel_dir != "." else "root"
            structural_edges.append({"source": parent_id, "target": node_id, "type": "structural"})

    # Second pass: Extract and map dependencies
    for node_id, node_info in file_nodes.items():
        if node_info["type"] != "file" or not node_id.endswith(('.py', '.js', '.ts', '.tsx', '.jsx')):
            continue
            
        full_path = os.path.join(repo_path, node_id)
        dependencies = extract_imports(full_path, repo_path)
        for dep in dependencies:
            # Check for direct matches or partial path matches
            dep_path_variants = [
                dep,
                dep.replace('.', '/'),
                dep + '.py',
                dep + '.js',
                dep + '.ts',
                dep + '.tsx',
                'src/' + dep,
                'app/' + dep
            ]
            
            found = False
            for variant in dep_path_variants:
                for other_id in file_nodes:
                    # More robust matching: exact match or ends with variant or variant is part of the path
                    if other_id == variant or other_id.endswith('/' + variant) or other_id.replace('.py', '').replace('.js', '').replace('.ts', '').endswith(variant.replace('.py', '').replace('.js', '').replace('.ts', '')):
                        if node_id != other_id:
                            edges.append({"source": node_id, "target": other_id, "type": "dependency"})
                            found = True
                            break
                if found: break

    # Combine both types of edges
    all_edges = structural_edges + edges
    print(f"DEBUG: Found {len(nodes)} nodes, {len(structural_edges)} structural edges, {len(edges)} dependency edges")
    return {"nodes": nodes, "edges": all_edges}

def extract_imports(file_path: str, repo_path: str) -> Set[str]:
    """Extracts imports from a file and maps them to relative paths in the repo."""
    dependencies = set()
    
    if file_path.endswith('.py'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                tree = ast.parse(f.read())
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            dependencies.add(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            dependencies.add(node.module)
        except Exception:
            pass # Skip files that fail to parse
            
    elif file_path.endswith(('.js', '.ts', '.tsx', '.jsx')):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # More comprehensive regex for JS/TS imports
                # Matches: import { x } from './y'; import x from 'y'; import './y';
                import_regex = r'(?:import|export)\s+.*?\s+from\s+[\'"](.+?)[\'"]|import\s+[\'"](.+?)[\'"]'
                require_regex = r'require\s*\(\s*[\'"](.+?)[\'"]\s*\)'
                
                for match in re.finditer(import_regex, content):
                    dep = match.group(1) or match.group(2)
                    if dep:
                        dependencies.add(dep)
                for match in re.finditer(require_regex, content):
                    dependencies.add(match.group(1))
        except Exception:
            pass
            
    # Normalize dependencies to repo-relative paths
    # This is a simplified version; real logic would involve path resolution
    # (e.g., resolving relative imports like './utils' or '../services')
    resolved_deps = set()
    for dep in dependencies:
        if dep:
            resolved_deps.add(dep)
            
    return resolved_deps
