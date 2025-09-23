#!/usr/bin/env bash
# exit on error
set -o errexit

# Usar el pip del entorno virtual para asegurar la instalación en el lugar correcto
/opt/render/project/src/.venv/bin/pip install -r requirements.txt