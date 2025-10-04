from fastapi import FastAPI
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime,timedelta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ ตั้งค่า CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client["aquasense"]
collection_PH = db["sensor_PH"]
collection_Turbidity = db["sensor_NTU"]
collection_NH3 = db["sensor_NH3"]
collection_temperature = db["sensor_temperature"]

def now_thai():
    return datetime.utcnow() + timedelta(hours=7)

class SensorPH (BaseModel):
    device_id: str
    ph: float
    timestamp: datetime = Field(default_factory=now_thai)

class SensorTurbidity (BaseModel):
    device_id: str
    NTU: float
    timestamp: datetime = Field(default_factory=now_thai)

class SensorNH3 (BaseModel):
    device_id: str
    NH3: float
    timestamp: datetime = Field(default_factory=now_thai)

class SensorTemperature (BaseModel):
    device_id: str
    temperature: float
    timestamp: datetime = Field(default_factory=now_thai)   

     

@app.post("/add_data/ph")
def add_PH(data: SensorPH):
    data_dict = data.dict()
    collection_PH.insert_one(data_dict)
    return {"status": "success", "data": data}

@app.post("/add_data/turbidity")
def add_turbidity(data: SensorTurbidity):
    data_dict = data.dict()
    collection_Turbidity.insert_one(data_dict)
    return {"status": "success", "data": data}

@app.post("/add_data/nh3")
def add_NH3(data: SensorNH3):
    data_dict = data.dict()
    collection_NH3.insert_one(data_dict)
    return {"status": "success", "data": data}

@app.post("/add_data/temperature")
def add_temperature(data: SensorTemperature):
    data_dict = data.dict()
    collection_temperature.insert_one(data_dict)
    return {"status": "success", "data": data}

@app.get("/get_data/ph", response_model=SensorPH)
def get_PH():
    doc = collection_PH.find_one(sort=[("timestamp", -1)])
    if doc :
        doc.pop("_id", None)
        return SensorPH(**doc)
    return None

@app.get("/get_data/nh3", response_model=SensorNH3)
def get_NH3():
    doc = collection_NH3.find_one(sort=[("timestamp", -1)])
    if doc:
        doc.pop("_id", None)
        return SensorNH3(**doc)
    return None

@app.get("/get_data/temperature" , response_model=SensorTemperature)
def get_temperature():
    doc = collection_temperature.find_one(sort=[("timestamp", -1)])
    if doc :
        doc.pop("_id", None)
        return SensorTemperature(**doc)
    return None

@app.get("/get_data/turbidity" , response_model=SensorTurbidity)
def get_turbidity():
    doc = collection_Turbidity.find_one(sort=[("timestamp", -1)])
    if doc :
        doc.pop("_id", None)
        return SensorTurbidity(**doc)
    return None
                                    
                        

