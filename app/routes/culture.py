from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

regions = [
    {
        "id": "central",
        "name": "Central Region",
        "food": ["Luwombo", "Matooke", "Groundnut sauce"],
        "dress": "Gomesi for women, Kanzu for men",
        "tradition": "Buganda kingdom ceremonies",
        "images": [
            "central dance.jpg", "central.jpg", "lake victoria.jpg",
            "backcloth.JPG", "food 2.JPG"
        ],
        "video": "XYZ123",
        "credit": "@UgandaTourismBoard",
        "testimonial": "The Buganda kingdom has a rich cultural heritage that dates back centuries."
    },
    # ... other regions (truncated for brevity)
]

@router.get("/cultures", response_class=HTMLResponse)
async def show_cultures(request: Request):
    return templates.TemplateResponse("uganda_culture.html", {"request": request, "regions": regions})