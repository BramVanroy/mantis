from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DATA_DIR = r"../data"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/projects")
async def get_projects() -> List[str]:
    dirs = [d.stem for d in Path(DATA_DIR).glob("*") if d.is_dir()]
    return dirs

@app.get("/project_texts/{project_id}")
async def get_project_text_names(project_id: str):
    data = ["P01_T01"]
    return data


@app.get("/text/{project_id}/{text_id}")
async def get_text(project_id: str, text_id: str):
    data = {
            "hasSrc": True,
            "hasTgt": True,
            "translations": [
                {
                    "src": 'They are expensive, sometimes pocket-sized and often advertised as "immune boosters" or gulps of goodness. and are sold in most pharmacies.',
                    "srcTokens": ['They', ' ', 'are', ' ', 'expensive,', ' ', 'sometimes', ' ', 'pocket-sized', ' ',
                                'and', ' ', 'often', ' ', 'advertised', ' ', 'as', ' ', '"immune', ' ', 'boosters"',
                                ' ', 'or', ' ', 'gulps', ' ', 'of', ' ', 'goodness', ' ', 'and', ' ', 'are', ' ',
                                'sold', ' ', 'in', ' ', 'most', ' ', 'pharmacies.'],
                    "tgt": 'Ze zijn duur, soms broekzakformaat, en vaak geadverteerd als "immuunsysteemboosters" of super food.',
                    "tgtTokens": ['Ze', ' ', 'zijn', ' ', 'duur,', ' ', 'soms', ' ', 'broekzakformaat,', ' ', 'en', ' ',
                                'vaak', ' ', 'geadverteerd', ' ', 'als', ' ', '"immuunsysteemboosters"', ' ', 'of',
                                ' ', 'super', ' ', 'food.'],
                },
                {
                    "src": 'Consumers have been persuaded that additives can be good for them as well as bad.',
                    "srcTokens": ['Consumers', ' ', 'have', ' ', 'been', ' ', 'persuaded', ' ', 'that', ' ', 'additives',
                                ' ', 'can', ' ', 'be', ' ', 'good', ' ', 'for', ' ', 'them', ' ', 'as', ' ', 'well',
                                ' ', 'as', ' ', 'bad.'],
                    "tgt": 'Ze worden in de meeste apotheken verkocht.',
                    "tgtTokens": ['Ze', ' ', 'worden', ' ', 'in,', ' ', 'de', ' ', 'meeste,', ' ', 'apotheken', ' ',
                                'verkocht.'],
                },
                {
                    "src": '',
                    "srcTokens": [],
                    "tgt": 'De consumenten zijn ervan overtuigd dat additieven zowel goed als slecht voor hen kunnen zijn.',
                    "tgtTokens": ['De', ' ', 'consumenten', ' ', 'zijn', ' ', 'ervan', ' ', 'overtuigd', ' ', 'dat', ' ',
                                'additieven', ' ', 'zowel', ' ', 'goed', ' ', 'als', ' ', 'slecht', ' ', 'voor', ' ',
                                'hen', ' ', 'kunnen', ' ', 'zijn.'],
                },
            ],
        }
    return data
