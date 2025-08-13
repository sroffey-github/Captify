from flask import Blueprint, current_app, request, send_file, jsonify, render_template
from werkzeug.utils import secure_filename
import subprocess
import whisper
import uuid
import os

bp = Blueprint("core", __name__)

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config.get("ALLOWED_EXTENSIONS", {"mp4"})

@bp.route("/")
def index():
    return render_template("index.html")

@bp.route("/generate", methods=["POST"])
def generate_subtitles():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)

    file.save(upload_path)

    unique_id = str(uuid.uuid4())
    srt_path = os.path.join(current_app.config["TEMP_FOLDER"], f"{unique_id}.srt")
    output_basename = f"{os.path.splitext(filename)[0]}_subtitled.mp4"
    output_path = os.path.join(current_app.config["TEMP_FOLDER"], output_basename)

    try:
        font = request.form.get("font_family", "Arial")
        font_size = request.form.get("font_size", "24")
        font_color = request.form.get("font_color", "FFFFFF").replace("&H","").replace("&","")
        bg_color = request.form.get("bg_color", None)
        if bg_color:
            bg_color = bg_color.replace("&H","").replace("&","")
        position = request.form.get("position", "Bottom")

        # Whisper transcription
        model = whisper.load_model("base")
        result = model.transcribe(upload_path)
        with open(srt_path, "w", encoding="utf-8") as f:
            for i, segment in enumerate(result["segments"], 1):
                start = segment["start"]
                end = segment["end"]
                text = segment["text"].strip().replace("\n", " ")
                f.write(f"{i}\n")
                f.write(f"{format_time(start)} --> {format_time(end)}\n")
                f.write(f"{text}\n\n")

        # FFmpeg subtitle style string
        style = f"FontName={font},FontSize={font_size},PrimaryColour=&H{font_color}&"
        if bg_color:
            style += f",BackColour=&H{bg_color}&"

        # Position mapping for FFmpeg
        vpos = {"top":"8","center":"50","bottom":"92"}.get(position.lower(), "92")
        style += f",Alignment=2,MarginV={vpos}"  # Alignment=2 is bottom-center by default

        cmd = [
            "ffmpeg",
            "-i", upload_path,
            "-vf", f"subtitles='{srt_path}:force_style={style}'",
            "-c:a", "copy",
            "-y",
            output_path
        ]
        subprocess.run(cmd, check=True)

        return jsonify({
            "status": "success",
            "message": "Video generated!",
            "download_url": f"/download/{output_basename}"
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        for path in [upload_path, srt_path]:
            if path and os.path.exists(path):
                os.remove(path)

@bp.route("/download/<filename>")
def download_video(filename):
    path = os.path.join(current_app.config["TEMP_FOLDER"], filename)
    if not os.path.exists(path):
        return "File not found", 404
    response = send_file(path, as_attachment=True, download_name=filename)
    os.remove(path)
    return response

def format_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
