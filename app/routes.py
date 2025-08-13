from flask import Blueprint, current_app, render_template

bp = Blueprint("core", __name__)

def allowed_file(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in current_app.config["ALLOWED_EXTENSIONS"]

@bp.route('/')
def index():
    return render_template('index.html')