import os
from flask import Flask

def create_app(config_class=None):
    app = Flask(__name__)

    if config_class is None:
        from config import DevConfig as DefaultConfig
        app.config.from_object(DefaultConfig)
    else:
        app.config.from_object(config_class)

    app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "uploads")
    app.config["TEMP_FOLDER"] = os.path.join(app.root_path, "temp")
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["TEMP_FOLDER"], exist_ok=True)

    from .routes import bp as core_bp
    app.register_blueprint(core_bp)

    @app.route("/health")
    def health():
        return "OK", 200

    return app
