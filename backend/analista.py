import pandas as pd
import sqlite3
import matplotlib.pyplot as plt
import datetime
import os

def generar_analisis():
    # 1. Conexión a la Bóveda
    if not os.path.exists('neochronos.db'):
        print("❌ Error: No se detecta la Bóveda (neochronos.db).")
        return

    conn = sqlite3.connect('neochronos.db')
    df = pd.read_sql_query("SELECT * FROM sessions", conn)
    conn.close()

    if df.empty:
        print("📭 La Bóveda está vacía. Registra más misiones para analizar.")
        return

    # Limpieza de datos
    df['duration'] = pd.to_numeric(df['duration'], errors='coerce').fillna(0)
    # Forzamos utc=True para normalizar zonas horarias mixtas (Dashboard vs Google)
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='ISO8601', errors='coerce', utc=True)
    df = df.dropna(subset=['timestamp']) # Eliminar registros con fechas corruptas

    print(f"📊 Analizando {len(df)} trazas temporales encontradas...")

    # --- 📈 GENERACIÓN DE VISUALIZACIONES ---
    plt.style.use('dark_background')
    
    # Gráfico 1: Distribución por Pilares (Inversión de Tiempo)
    plt.figure(figsize=(10, 6))
    pilar_dist = df.groupby('pillar')['duration'].sum()
    colors = ['#ffa500', '#ff007a', '#f0f000', '#00f2ff', '#39ff14'] # Forja, Conexión, Espíritu, Operación, Vitalidad
    pilar_dist.plot(kind='pie', autopct='%1.1f%%', colors=colors, startangle=140)
    plt.title('DISTRIBUCIÓN DE ENERGÍA POR PILAR')
    plt.ylabel('')
    plt.savefig('analisis_pilares.png')
    print("✅ Gráfico de Pilares generado.")

    # --- 📄 GENERACIÓN DEL MANIFIESTO PARA IA (REPORT) ---
    reporte_path = 'reporte_conciencia.md'
    with open(reporte_path, 'w', encoding='utf-8') as f:
        f.write(f"# 🛡️ REPORTE DE CONCIENCIA NEO-CHRONOS\n")
        f.write(f"**Fecha de Análisis:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## 📊 RESUMEN EJECUTIVO\n")
        f.write(f"- **Total de Misiones:** {len(df)}\n")
        f.write(f"- **Tiempo Total Registrado:** {df['duration'].sum()} minutos\n")
        f.write(f"- **Pilar Dominante:** {pilar_dist.idxmax()} ({pilar_dist.max()} min)\n\n")

        f.write("## ⚒️ DISTRIBUCIÓN DE PILARES\n")
        for pilar, dur in pilar_dist.items():
            f.write(f"- **{pilar}:** {dur} minutos ({round(dur/df['duration'].sum()*100, 1)}%)\n")

        f.write("\n## ⚡ RESONANCIA Y PATRONES\n")
        res_dist = df.groupby('resonance').size()
        for res, count in res_dist.items():
            f.write(f"- **Fase {res}:** {count} sesiones\n")

        f.write("\n## 📋 ÚLTIMAS 20 TRAZAS (CONTEXTO TÁCTICO)\n")
        f.write("| Actividad | Pilar | Resonancia | Duración |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for _, row in df.tail(20).iterrows():
            f.write(f"| {row['activity']} | {row['pillar']} | {row['resonance']} | {row['duration']} min |\n")

        f.write("\n\n---\n*Instrucción para IA de Análisis:* Analiza los patrones de tiempo de este usuario. Identifica si hay un desbalance entre la Forja y la Operación. Detecta si la Vitalidad es suficiente para sostener la carga de trabajo.*")

    print(f"✅ Manifiesto para IA generado en: {reporte_path}")

if __name__ == "__main__":
    generar_analisis()
