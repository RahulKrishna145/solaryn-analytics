from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class State(Base):
    __tablename__ = 'states'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    districts = relationship('District', back_populates='state')

class District(Base):
    __tablename__ = 'districts'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state_id = Column(Integer, ForeignKey('states.id'))
    state = relationship('State', back_populates='districts')
    stations = relationship('Station', back_populates='district')
    households = relationship('Household', back_populates='district')

class Station(Base):
    __tablename__ = 'stations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    district_id = Column(Integer, ForeignKey('districts.id'))
    district = relationship('District', back_populates='stations')

class Household(Base):
    __tablename__ = 'households'
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    district_id = Column(Integer, ForeignKey('districts.id'))
    district = relationship('District', back_populates='households')
    status = Column(String, default='pending')  # 'pending' or 'approved'
    associated_station_id = Column(Integer, ForeignKey('stations.id'), nullable=True)
    associated_station = relationship('Station', foreign_keys=[associated_station_id])
