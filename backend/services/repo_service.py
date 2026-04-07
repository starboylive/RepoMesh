import os
import shutil
import stat
import tempfile
from git import Repo

def _remove_readonly(func, path, excinfo):
    """Retry removal for read-only files on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def clone_repository(repo_url: str) -> str:
    """Clones a repository to a temporary directory and returns the path."""
    # Basic URL normalization
    repo_url = repo_url.strip()
    if not repo_url.endswith('.git') and 'github.com' in repo_url:
        repo_url = repo_url.rstrip('/') + '.git'
        
    temp_dir = tempfile.mkdtemp()
    try:
        Repo.clone_from(repo_url, temp_dir, depth=1)
        return temp_dir
    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, onerror=_remove_readonly)
        raise Exception(f"Failed to clone repository: {str(e)}")

def cleanup_repository(repo_path: str):
    """Deletes the temporary repository directory."""
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path, onerror=_remove_readonly)
