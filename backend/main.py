from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import datetime

# --- CONFIGURACIÓN DE LA BASE DE DATOS (LA BÓVEDA) ---
DATABASE_URL = "sqlite:///./neochronos.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELO DE DATOS SQL (EL PLANO ESTRATÉGICO) ---
class SessionDB(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    activity = Column(String)      # Nombre de la misión
    category = Column(String)      # Dominio Táctico
    resonance = Column(String)     # Fase de Resonancia (Baja, Fluido, Carga)
    pillar = Column(String)        # Área de Influencia (OP, CON, VIT, ESP)
    start_time = Column(String)    # Hora de inicio
    end_time = Column(String)      # Hora de fin
    duration = Column(Integer)     # En minutos
    timestamp = Column(String)     # ISO Format (Fecha completa)

# Crear la tabla en el archivo neochronos.db
Base.metadata.create_all(bind=engine)

# --- MODELOS DE VALIDACIÓN (PYDANTIC) ---
class SessionSchema(BaseModel):
    activity: str
    category: str
    resonance: str
    pillar: str
    start_time: str
    end_time: str
    duration: int
    timestamp: str

app = FastAPI()

# Configuración del Puente (CORS)
# Ajustado para permitir comunicaciones desde archivos locales (file://)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "OPERATIVO",
        "mensaje": "Comandante Sajor, sistema de datos reconfigurado y listo.",
        "fase": 4
    }

@app.post("/api/session")
def save_session(session: SessionSchema, db: Session = Depends(get_db)):
    print(f"📡 REGISTRO ENTRANTE: {session.activity} | {session.pillar}")
    
    # IMPORTACIÓN DIFERIDA para evitar ciclos si fuera necesario, 
    # pero aquí la usaremos directamente.
    from google_calendar import create_calendar_event 

    # 1. Crear registro en SQL con el nuevo esquema
    db_session = SessionDB(
        activity=session.activity,
        category=session.category,
        resonance=session.resonance,
        pillar=session.pillar,
        start_time=session.start_time,
        end_time=session.end_time,
        duration=session.duration,
        timestamp=session.timestamp
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # 2. PROYECTAR EN LA NUBE (Google Calendar)
    # Lo hacemos después del commit para asegurar que si falla Google, al menos quedó en SQL.
    create_calendar_event(
        activity=session.activity,
        pilar=session.pillar,
        start_time_str=session.start_time,
        end_time_str=session.end_time,
        timestamp_iso=session.timestamp
    )
    
    return {
        "status": "OPERACIÓN_ARCHIVADA_Y_SINCRONIZADA", 
        "id": db_session.id,
        "misión": db_session.activity
    }
