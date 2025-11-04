import os
import shutil
import tempfile
import uuid
import subprocess
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Code Runner API")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Map language keys to a docker image and run command template
# {file} and {workdir} will be replaced
LANGUAGE_RUNNERS = {
    "python": {
        "image": "python:3.11-slim",
        "cmd": "python {file}"
    },
    "javascript": {
        "image": "node:20-slim",
        "cmd": "node {file}"
    },
    "java": {
        "image": "openjdk:17-slim",
        # Java requires javac then java. We expect main class in Main.java
        "cmd": "bash -lc 'javac {file} && java -cp {workdir} Main'"
    },
    "cpp": {
        "image": "gcc:12",
        "cmd": "bash -lc 'g++ -std=c++17 {file} -O2 -o /tmp/a.out && /tmp/a.out'"
    },
    "c": {
        "image": "gcc:12",
        "cmd": "bash -lc 'gcc {file} -O2 -o /tmp/a.out && /tmp/a.out'"
    },
    "go": {
        "image": "golang:1.20",
        "cmd": "bash -lc 'go run {file}'"
    },
    "ruby": {
        "image": "ruby:3.2-slim",
        "cmd": "ruby {file}"
    },
    "bash": {
        "image": "alpine:3.18",
        # run as a shell script
        "cmd": "bash {file}"
    }
    # add more languages by adding entries here
}

# Execution request model
class RunRequest(BaseModel):
    language: str
    code: str
    stdin: Optional[str] = None
    timeout_seconds: Optional[int] = 5  # default 5s


@app.post("/run")
def run_code(req: RunRequest):
    lang = req.language.lower()
    if lang not in LANGUAGE_RUNNERS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {lang}")

    runner = LANGUAGE_RUNNERS[lang]
    image = runner["image"]
    cmd_template = runner["cmd"]

    # Create temporary working directory
    tmpdir = Path(tempfile.mkdtemp(prefix="code-run-"))
    try:
        # Choose filename based on language
        ext_map = {
            "python": "py",
            "javascript": "js",
            "java": "java",
            "cpp": "cpp",
            "c": "c",
            "go": "go",
            "ruby": "rb",
            "bash": "sh",
        }
        ext = ext_map.get(lang, "txt")
        filename = "Main." + ext if lang == "java" else f"code.{ext}"
        file_path = tmpdir / filename
        file_path.write_text(req.code, encoding="utf-8")

        # If stdin provided, write to file
        stdin_file = None
        if req.stdin:
            stdin_file = tmpdir / "input.txt"
            stdin_file.write_text(req.stdin, encoding="utf-8")

        # Build docker run command
        # - use --rm to remove container
        # - --network none to disable network
        # - --memory and --cpus to limit resources
        # - -v mount the tmpdir into /workspace inside container
        # - run in working dir /workspace
        container_workdir = "/workspace"
        container_file = f"{container_workdir}/{filename}"
        cmd_to_run = cmd_template.format(file=container_file, workdir=container_workdir)

        docker_cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "256m",
            "--cpus", "0.5",
            "-v", f"{str(tmpdir)}:{container_workdir}:ro",  # mount read-only
            "--workdir", container_workdir,
            image,
            "bash", "-lc", cmd_to_run
        ]

        # If code needs write access (e.g., compiled output), we can remount rw for specific languages:
        # for compiled languages, we put the compile output in /tmp inside the container already.

        # Run docker command and capture output
        try:
            completed = subprocess.run(
                docker_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=req.timeout_seconds
            )
        except subprocess.TimeoutExpired:
            # try to kill any lingering container using a unique pattern is difficult; rely on --rm and timeout
            return {"stdout": "", "stderr": "Execution timed out.", "exit_code": None, "timed_out": True}

        stdout = completed.stdout
        stderr = completed.stderr
        exit_code = completed.returncode

        # If stdin provided, optionally we could pipe it via `echo "..." | docker run ...` but for simplicity we omitted piping stdin.
        # (You can enhance to mount input.txt and change command to 'cat input.txt | <cmd>' if needed.)

        return {
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": exit_code,
            "timed_out": False
        }
    finally:
        # clean up
        try:
            shutil.rmtree(tmpdir)
        except Exception:
            pass
