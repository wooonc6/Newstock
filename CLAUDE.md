# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

- **System Python**: Python 3.14.2 (default in terminal)
- **Pose model env**: `mp_env\` — Python 3.11.2 venv created with `C:\Program Files\Python311\python.exe`; use this for `pose_model\pose_model.py` because MediaPipe requires Python ≤ 3.11
- Run scripts: `python script.py` (system) or `mp_env\Scripts\python.exe script.py` (pose model)
- Run notebooks: `jupyter notebook` or open `.ipynb` in VSCode

## Projects

### `my_vscode\` — School Python Exercises

Python class assignments organized by module:

| Prefix | Topic |
|--------|-------|
| `m1_*` | Basics: conditionals, input, random (rock-scissors-paper, BMI, hourly rate, projectile) |
| `m2_*` | Functions & classes: factorial, dice, virtual dog game |
| `m3_*` | Algorithms: greedy, brute-force, bug-finding, prime sieve, Fibonacci |

`exercise_function.ipynb` is the main Jupyter notebook for function exercises. Middle exam files (`middle_exam_*.py`) are reference solutions for exam practice problems.

Run any exercise: `python my_vscode\<filename>.py`

### `pose_model\` — Human Pose Estimation

`pose_model\pose_model.py` reads numbered images (`1.png` – `10.png`) from the same folder, runs MediaPipe Pose, computes **2D joint angles** (right elbow: shoulder–elbow–wrist; right knee: hip–knee–ankle), draws landmarks on the image, and saves results as `output_N.jpg`.

Key dependencies (must use `mp_env`): `opencv-python`, `mediapipe`, `numpy`

Run: `mp_env\Scripts\python.exe pose_model\pose_model.py`

Input images must be named `1.png` through `10.png` (or `.jpg`/`.jpeg`) and placed in `pose_model\`. The script auto-detects missing numbers and skips undetectable images.

The knee angle correction `if knee_angle < 100: knee_angle = 180 - knee_angle` handles MediaPipe's landmark direction inconsistency for standing vs. seated poses.
