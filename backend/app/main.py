
import math
import requests
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .district_geo import district_centroids
from .database import init_db, SessionLocal
from .seed import seed_data
from . import models

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Simulated Analytics Endpoint ---
# Place this after app and get_db are defined
@app.get("/analytics/summary")
def analytics_summary(db: Session = Depends(get_db)):
    # Real analytics: households per station
    stations = db.query(models.Station).all()
    households = db.query(models.Household).all()
    station_stats = []
    station_id_to_station = {s.id: s for s in stations}
    # Count households per station
    households_per_station = {}
    for h in households:
        sid = h.associated_station_id
        if sid:
            households_per_station[sid] = households_per_station.get(sid, 0) + 1
    for s in stations:
        station_stats.append({
            "id": s.id,
            "name": s.name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "household_count": households_per_station.get(s.id, 0)
        })
    return {
        "total_stations": len(stations),
        "total_households": len(households),
        "stations": station_stats
    }

import requests
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .district_geo import district_centroids
from .database import init_db, SessionLocal
from .seed import seed_data
from . import models

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    init_db()
    db = SessionLocal()
    seed_data(db)
    db.close()

@app.get("/")
def root():
    return {"message": "EV Charging Stations API is running."}


# --- Pydantic Schemas ---

# For user application (no lat/lon input)
class HouseholdApplication(BaseModel):
    district_id: int

class HouseholdCreate(BaseModel):
    latitude: float
    longitude: float
    district_id: int

class StationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    district_id: int


# --- Household Application (user) ---
import random
def random_point_near(lat, lon, radius_km=5):
    # Generate random point within radius_km of (lat, lon)
    r = radius_km / 111  # ~1 deg lat ~111km
    u, v = random.random(), random.random()
    w = r * (u ** 0.5)
    t = 2 * math.pi * v
    dx = w * math.cos(t)
    dy = w * math.sin(t)
    return lat + dx, lon + dy

@app.post("/household-application")
def apply_household(application: HouseholdApplication, db: Session = Depends(get_db)):
    # Get district centroid
    district = db.query(models.District).filter(models.District.id == application.district_id).first()
    state = db.query(models.State).filter(models.State.id == district.state_id).first() if district else None
    if not (district and state):
        raise HTTPException(status_code=404, detail="District not found")
    state_name, district_name = state.name, district.name
    if state_name not in district_centroids or district_name not in district_centroids[state_name]:
        raise HTTPException(status_code=400, detail="No centroid for district")
    lat, lon = district_centroids[state_name][district_name]
    rand_lat, rand_lon = random_point_near(lat, lon, radius_km=5)
    new_household = models.Household(
        latitude=rand_lat,
        longitude=rand_lon,
        district_id=application.district_id,
        status='pending',
        associated_station_id=None
    )
    db.add(new_household)
    db.commit()
    db.refresh(new_household)
    return {"id": new_household.id, "latitude": new_household.latitude, "longitude": new_household.longitude, "district_id": new_household.district_id, "status": new_household.status}

# --- Households CRUD (admin/manual) ---
@app.post("/households")
def add_household(household: HouseholdCreate, db: Session = Depends(get_db)):
    # Find nearest station in district (or state)
    stations = db.query(models.Station).join(models.District).filter(models.District.id == household.district_id).all()
    district = db.query(models.District).filter(models.District.id == household.district_id).first()
    state_id = district.state_id if district else None
    if state_id:
        state_stations = db.query(models.Station).join(models.District).filter(models.District.state_id == state_id).all()
        stations = list({s.id: s for s in stations + state_stations}.values())
    min_dist = None
    nearest = None
    for s in stations:
        dist = haversine(household.latitude, household.longitude, s.latitude, s.longitude)
        if min_dist is None or dist < min_dist:
            min_dist = dist
            nearest = s
    associated_station_id = nearest.id if nearest else None
    new_household = models.Household(
        latitude=household.latitude,
        longitude=household.longitude,
        district_id=household.district_id,
        status='approved',
        associated_station_id=associated_station_id
    )
    db.add(new_household)
    db.commit()
    db.refresh(new_household)
    return {
        "id": new_household.id,
        "latitude": new_household.latitude,
        "longitude": new_household.longitude,
        "district_id": new_household.district_id,
        "status": new_household.status,
        "associated_station_id": new_household.associated_station_id
    }


@app.delete("/households/{household_id}")
def delete_household(household_id: int, db: Session = Depends(get_db)):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    db.delete(household)
    db.commit()
    return {"detail": "Household deleted"}

# --- Admin: List pending applications ---
@app.get("/household-applications/pending")
def list_pending_households(db: Session = Depends(get_db)):
    pending = db.query(models.Household).filter(models.Household.status == 'pending').all()
    return [
        {
            "id": h.id,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "district_id": h.district_id
        } for h in pending
    ]

# --- Admin: Approve household application ---
@app.post("/household-applications/{household_id}/approve")
def approve_household(household_id: int, radius: float = Query(10), db: Session = Depends(get_db)):
    household = db.query(models.Household).filter(models.Household.id == household_id, models.Household.status == 'pending').first()
    if not household:
        raise HTTPException(status_code=404, detail="Pending household not found")
    # Find nearest station within radius
    stations = db.query(models.Station).join(models.District).filter(models.District.id == household.district_id).all()
    district = db.query(models.District).filter(models.District.id == household.district_id).first()
    state_id = district.state_id if district else None
    if state_id:
        state_stations = db.query(models.Station).join(models.District).filter(models.District.state_id == state_id).all()
        stations = list({s.id: s for s in stations + state_stations}.values())
    min_dist = None
    nearest = None
    for s in stations:
        dist = haversine(household.latitude, household.longitude, s.latitude, s.longitude)
        if dist <= radius and (min_dist is None or dist < min_dist):
            min_dist = dist
            nearest = s
    if not nearest:
        raise HTTPException(status_code=400, detail="No station within radius for approval")
    household.status = 'approved'
    household.associated_station_id = nearest.id
    db.commit()
    return {"id": household.id, "status": household.status, "associated_station_id": nearest.id}

# --- Stations CRUD ---
@app.post("/stations")
def add_station(station: StationCreate, db: Session = Depends(get_db)):
    new_station = models.Station(
        name=station.name,
        latitude=station.latitude,
        longitude=station.longitude,
        district_id=station.district_id
    )
    db.add(new_station)
    db.commit()
    db.refresh(new_station)
    return {"id": new_station.id, "name": new_station.name, "latitude": new_station.latitude, "longitude": new_station.longitude, "district_id": new_station.district_id}

@app.delete("/stations/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(station)
    db.commit()
    return {"detail": "Station deleted"}
@app.get("/states")
def get_states(db: Session = Depends(get_db)):
    states = db.query(models.State).all()
    return [{"id": s.id, "name": s.name} for s in states]

# 2. GET /states/{id}/districts
# 2. GET /states/{id}/districts

# Enhanced: GET /states/{id}/districts with centroid and solar flux
@app.get("/states/{state_id}/districts")
def get_districts(state_id: int, db: Session = Depends(get_db)):
    districts = db.query(models.District).filter(models.District.state_id == state_id).all()
    state = db.query(models.State).filter(models.State.id == state_id).first()
    state_name = state.name if state else None
    result = []
    for d in districts:
        # Get centroid
        lat, lon = None, None
        if state_name in district_centroids and d.name in district_centroids[state_name]:
            lat, lon = district_centroids[state_name][d.name]
        # Fetch solar flux from NASA POWER API (annual average, demo)
        solar_flux = None
        if lat and lon:
            try:
                url = f"https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude={lon}&latitude={lat}&format=JSON"
                resp = requests.get(url, timeout=5)
                if resp.ok:
                    data = resp.json()
                    # Get annual mean
                    solar_flux = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']['ANN']
            except Exception:
                solar_flux = None
        result.append({
            "id": d.id,
            "name": d.name,
            "latitude": lat,
            "longitude": lon,
            "solar_flux": solar_flux
        })
    return result

# 3. GET /districts/{id}/stations
@app.get("/districts/{district_id}/stations")
def get_stations(district_id: int, db: Session = Depends(get_db)):
    stations = db.query(models.Station).filter(models.Station.district_id == district_id).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "latitude": s.latitude,
            "longitude": s.longitude
        } for s in stations
    ]

# 4. GET /households/{id}/nearest-station?radius=10
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.get("/households/{household_id}/nearest-station")
def get_nearest_station(household_id: int, radius: float = Query(10), db: Session = Depends(get_db)):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    stations = db.query(models.Station).join(models.District).filter(models.District.id == household.district_id).all()
    # Also consider all stations in the state
    district = db.query(models.District).filter(models.District.id == household.district_id).first()
    state_id = district.state_id if district else None
    if state_id:
        state_stations = db.query(models.Station).join(models.District).filter(models.District.state_id == state_id).all()
        stations = list({s.id: s for s in stations + state_stations}.values())
    min_dist = None
    nearest = None
    for s in stations:
        dist = haversine(household.latitude, household.longitude, s.latitude, s.longitude)
        if dist <= radius and (min_dist is None or dist < min_dist):
            min_dist = dist
            nearest = s
    if not nearest:
        raise HTTPException(status_code=404, detail="No station found within radius")
    return {
        "station": {
            "id": nearest.id,
            "name": nearest.name,
            "latitude": nearest.latitude,
            "longitude": nearest.longitude
        },
        "distance_km": min_dist
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# List households by district (with status and associated station)
@app.get("/districts/{district_id}/households")
def get_households_by_district(district_id: int, db: Session = Depends(get_db)):
    households = db.query(models.Household).filter(models.Household.district_id == district_id).all()
    result = []
    for h in households:
        station = None
        if h.associated_station_id:
            s = db.query(models.Station).filter(models.Station.id == h.associated_station_id).first()
            if s:
                station = {"id": s.id, "name": s.name, "latitude": s.latitude, "longitude": s.longitude}
        result.append({
            "id": h.id,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "district_id": h.district_id,
            "status": h.status,
            "associated_station": station
        })
    return result