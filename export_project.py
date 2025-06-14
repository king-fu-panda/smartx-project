
import os
import zipfile
from datetime import datetime

def create_project_export():
    """Export all project files to a downloadable zip"""
    
    # Define files and directories to include
    include_patterns = [
        'app.py',
        'main.py',
        'pyproject.toml',
        'static/',
        'templates/',
        'README.md'  # if it exists
    ]
    
    # Create zip filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"smartx_project_export_{timestamp}.zip"
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Skip hidden directories and __pycache__
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            
            for file in files:
                if not file.startswith('.') and not file.endswith('.pyc'):
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, '.')
                    zipf.write(file_path, arcname)
                    print(f"Added: {arcname}")
    
    print(f"\nProject exported to: {zip_filename}")
    print(f"File size: {os.path.getsize(zip_filename) / 1024:.1f} KB")
    
    return zip_filename

if __name__ == "__main__":
    create_project_export()
