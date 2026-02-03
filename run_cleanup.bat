@echo off
cd /d "%~dp0.."
call venv_app\Scripts\activate.bat
python backend\tasks\cleanup_old_pedidos.py
