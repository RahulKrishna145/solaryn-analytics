import json
import os
from sqlalchemy.orm import Session
from .models import State, District, Station
import random

def seed_data(db: Session):
    # Check if already seeded
    if db.query(State).first():
        return
    seed_path = os.path.join(os.path.dirname(__file__), '../seed/districts_india.json')
    with open(seed_path, 'r') as f:
        data = json.load(f)
    state_objs = []
    for state_name, districts in data.items():
        state = State(name=state_name)
        db.add(state)
        db.flush()  # get state.id
        for district_name in districts:
            district = District(name=district_name, state_id=state.id)
            db.add(district)
            db.flush()
            # Add 2 stations per district with random but plausible coordinates
            for i in range(2):
                lat = random.uniform(8.0, 23.0)  # India lat range
                lon = random.uniform(73.0, 88.0) # India lon range
                station = Station(
                    name=f"{district_name} Station {i+1}",
                    latitude=lat,
                    longitude=lon,
                    district_id=district.id
                )
                db.add(station)
    db.commit()
