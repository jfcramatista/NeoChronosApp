import os.path
import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from main import SessionLocal, SessionDB  # Importamos la Bóveda

# Si modificas estos SCOPES, elimina el archivo token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar'] # PERMISO DE ESCRITURA ACTIVADO

def get_calendar_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except:
                creds = None
        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('calendar', 'v3', credentials=creds)

def create_calendar_event(activity, pilar, start_time_str, end_time_str, timestamp_iso):
    """
    Crea un evento en Google Calendar basado en una sesión del Dashboard.
    """
    service = get_calendar_service()
    if not service:
        return

    # Extraer la fecha del timestamp ISO (YYYY-MM-DD)
    date_part = timestamp_iso.split('T')[0]
    
    # Construir ISO DateTime para Google (Formato: YYYY-MM-DDTHH:MM:SSZ)
    start_iso = f"{date_part}T{start_time_str}:00"
    end_iso = f"{date_part}T{end_time_str}:00"

    event = {
        'summary': f"[{pilar}] {activity}",
        'description': f'Misión registrada desde Neo-Chronos Dashboard. Pilar: {pilar}',
        'start': {
            'dateTime': start_iso,
            'timeZone': 'America/Bogota', # Ajustado a tu zona horaria
        },
        'end': {
            'dateTime': end_iso,
            'timeZone': 'America/Bogota',
        },
        'colorId': '7' if pilar == 'Operación' else '10' # Colores tácticos en Calendar
    }

    try:
        e = service.events().insert(calendarId='primary', body=event).execute()
        print(f"📡 EVENTO SINCRONIZADO EN NUBE: {e.get('htmlLink')}")
        return e
    except Exception as error:
        print(f'❌ Error al proyectar en la nube: {error}')
        return None

def categorize_event(summary):
    """
    Lógica de El Oráculo refinada para Neo.
    Incluye el 5to pilar: FORJA.
    """
    summary = summary.lower()
    
    # --- PILAR: FORJA (FOR) ---
    # La construcción del ser: estudio, carácter, autoconocimiento.
    if any(word in summary for word in ['programación', 'estudiar', 'clase', 'aprender', 'código', 'matriz']):
        return "Forja", "Fluido"
    
    # --- PILAR: OPERACIÓN (OP) ---
    # Legado profesional, misiones de trabajo, proyectos sociales/ambientales/políticos.
    if any(word in summary for word in ['proyecto', 'bello aseo', 'trabajo', 'universo', 'reunion', 'misión', 'alianza verde', 'verde', 'ecoalqueria', 'huerta']):
        return "Operación", "Fluido"
    
    # --- PILAR: VITALIDAD (VIT) ---
    # Hardware biológico y mantenimiento del entorno base (limpieza).
    if any(word in summary for word in ['almuerzo', 'fifa', 'entrenar', 'gym', 'descanso', 'pereza', 'sueño', 'comida', 'dormir', 'limpieza']):
        return "Vitalidad", "Baja"
    
    # --- PILAR: CONEXIÓN (CON) ---
    if any(word in summary for word in ['familia', 'papá', 'mamá', 'amigos', 'manada', 'compartir', 'social']):
        return "Conexión", "Baja"
    
    # --- PILAR: ESPÍRITU (ESP) ---
    if any(word in summary for word in ['meditar', 'reflexión', 'espíritu', 'propósito', 'meditación']):
        return "Espíritu", "Carga"
        
    return "Otros", "Fluido"

def sync_past_events(days=7):
    """
    Recupera eventos del pasado y los graba en la piedra de SQL.
    """
    service = get_calendar_service()
    db = SessionLocal()
    
    # Calculamos el horizonte temporal (hace 7 días)
    now = datetime.datetime.utcnow()
    time_min = (now - datetime.timedelta(days=days)).isoformat() + 'Z'
    
    print(f"🕵️ Escaneando la Matrix hacia atrás ({days} días)...")
    
    try:
        events_result = service.events().list(
            calendarId='primary', timeMin=time_min, timeMax=now.isoformat() + 'Z',
            singleEvents=True, orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        if not events:
            print("📭 Tu pasado está limpio según Google, Neo.")
            return

        print(f"📡 Se han detectado {len(events)} trazas temporales. Sincronizando...")

        for event in events:
            summary = event.get('summary', 'Misión sin nombre')
            start_raw = event['start'].get('dateTime', event['start'].get('date'))
            end_raw = event['end'].get('dateTime', event['end'].get('date'))
            
            # Procesar fechas
            try:
                # Ejemplo: 2024-01-25T10:00:00-05:00
                st = datetime.datetime.fromisoformat(start_raw.replace('Z', '+00:00'))
                et = datetime.datetime.fromisoformat(end_raw.replace('Z', '+00:00'))
                duration = int((et - st).total_seconds() / 60)
                start_time = st.strftime("%H:%M")
                end_time = et.strftime("%H:%M")
                date_iso = st.date().isoformat()
            except:
                continue # Saltar eventos de todo el día por ahora

            pillar, resonance = categorize_event(summary)

            # Verificar si ya existe (evitar duplicados simples)
            existing = db.query(SessionDB).filter(
                SessionDB.activity == summary, 
                SessionDB.timestamp.contains(date_iso)
            ).first()

            if not existing:
                new_entry = SessionDB(
                    activity=summary,
                    category="Google Sync",
                    resonance=resonance,
                    pillar=pillar,
                    start_time=start_time,
                    end_time=end_time,
                    duration=duration,
                    timestamp=st.isoformat()
                )
                db.add(new_entry)
                print(f"✅ Sincronizado: {summary} ({pillar})")

        db.commit()
        print("\n🏛️ Sincronización con la Bóveda SQL completada.")

    except Exception as e:
        print(f"❌ Error en la reconexión: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    sync_past_events(7)
