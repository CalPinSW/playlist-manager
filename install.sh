#!/bin/bash

cd backend && poetry install && cd ../frontend && npm install && cd ..
if [ "$?" -ne 0 ]; then
    echo "Failed to install packages";
    exit 1;
else
    echo "Frontend and backend dependencies installed"
fi
