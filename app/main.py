"""
SAT-SA — Supervisory Analytics Tool for SOC Assessment
Problem Statement: SIH26157
Domain: Cyber Security
FastAPI Reference Implementation
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime

app = FastAPI(
    title="SAT-SA — Supervisory Analytics Tool for SOC Assessment",
    description="Explainable supervisory analytics platform for periodic SOC operational evidence review (SIH26157)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "platform": "SAT-SA Supervisory Analytics (FastAPI Backend)",
        "sih": "SIH26157",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/")
def root():
    return {"message": "SAT-SA Supervisory Analytics API. See /docs for Swagger UI."}
