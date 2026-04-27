#!/bin/bash
cd "$(dirname "$0")"
./venv/bin/python manage.py runserver "$@"
