export type VisualSource = {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  type: "city" | "border" | "conflict" | "traffic" | "port" | "airport"
  embedUrl: string
  source: string
  description: string
}

export const visualSources: VisualSource[] = [
  // ========== STREAMS VERIFICADOS (originales) ==========
  {
    id: "philippines-davao",
    name: "Davao – City Live Camera",
    country: "Philippines",
    lat: 7.1907,
    lon: 125.4553,
    type: "city",
    embedUrl:
      "https://www.youtube.com/embed/uvNosrM4muQ?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
    source: "YouTube Live",
    description:
      "24/7 live camera feed from Davao City providing real-time urban activity context.",
  },

  {
    id: "ireland-dublin",
    name: "Dublin – City Center Live Camera",
    country: "Ireland",
    lat: 53.3498,
    lon: -6.2603,
    type: "city",
    embedUrl:
      "https://www.youtube.com/embed/u4UZ4UvZXrg?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
    source: "YouTube Live",
    description:
      "Live view from central Dublin, useful as a signal of civilian and traffic activity.",
  },
  
  {
    id: "iran-tehran",
    name: "Tehran – City Live Camera",
    country: "Iran",
    lat: 35.6892,
    lon: 51.389,
    type: "city",
    embedUrl:
      "https://www.youtube.com/embed/-zGuR1qVKrU?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
    source: "YouTube Live",
    description:
      "Live camera feed from Tehran providing real-time visual context of the city.",
  },

  // ========== AÑADIR MÁS CÁMARAS AQUÍ ==========
  
  /*
   * CÓMO AÑADIR MÁS CÁMARAS:
   * 
   * 1. Buscar en YouTube: "live camera [ciudad]" o "[ciudad] live stream"
   * 2. Filtrar por: Live (en vivo)
   * 3. Copiar el ID del video (después de watch?v=)
   * 4. Usar formato: https://www.youtube.com/embed/[VIDEO_ID]?autoplay=1&mute=1&controls=1&rel=0&playsinline=1
   * 
   * Ejemplo:
   * URL de YouTube: https://www.youtube.com/watch?v=ABC123XYZ
   * Embed URL: https://www.youtube.com/embed/ABC123XYZ?autoplay=1&mute=1&controls=1&rel=0&playsinline=1
   * 
   * FUENTES RECOMENDADAS:
   * - EarthCam: https://www.earthcam.com (cámaras HD profesionales)
   * - YouTube Live: buscar "24/7 live camera"
   * - Webcams públicas de gobiernos (DOT, aeropuertos, etc.)
   * 
   * PLANTILLA PARA AÑADIR:
   * 
   * {
   *   id: "pais-ciudad-ubicacion",
   *   name: "Ubicación – Ciudad",
   *   country: "País",
   *   lat: 00.0000,
   *   lon: 00.0000,
   *   type: "city" | "border" | "conflict" | "traffic" | "port" | "airport",
   *   embedUrl: "https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
   *   source: "YouTube Live",
   *   description: "Descripción del propósito OSINT de esta cámara.",
   * },
   */

  // ========== EJEMPLOS DE BÚSQUEDAS PARA ENCONTRAR MÁS ==========
  
  /*
   * CIUDADES PRINCIPALES:
   * - "new york live camera"
   * - "tokyo shibuya live"
   * - "london live stream"
   * - "paris live camera"
   * 
   * BORDERS:
   * - "border crossing live camera"
   * - "us mexico border live"
   * - "checkpoint live camera"
   * 
   * TRAFFIC:
   * - "highway traffic camera live"
   * - "interstate live camera"
   * - "[ciudad] traffic live"
   * 
   * AIRPORTS:
   * - "[aeropuerto] live camera"
   * - "airport runway live"
   * - "planespotting live"
   * 
   * PORTS:
   * - "port live camera"
   * - "harbor live stream"
   * - "shipping live camera"
   * 
   * CONFLICT ZONES:
   * - "[ciudad] square live"
   * - "[lugar] protest camera"
   * - "[zona] monitoring camera"
   */

  // ========== WEBCAMS ALTERNATIVAS (no YouTube) ==========
  
  /*
   * EARTHCAM (Professional HD Webcams):
   * Ventaja: Muy confiables, alta calidad, 24/7
   * Desventaja: Algunos requieren subscripción
   * URL format: https://www.earthcam.com/[región]/[ciudad]/[ubicación]
   * 
   * WINDY.COM WEBCAMS:
   * Ventaja: Miles de cámaras públicas worldwide
   * URL: https://www.windy.com/webcams
   * Desventaja: Embed puede ser complicado
   * 
   * GOVERNMENT CAMS (DOT, Police, etc):
   * Ventaja: Muy confiables, datos oficiales
   * Ejemplo: State DOT traffic cameras
   * Desventaja: Cada estado/país tiene su propio sistema
   * 
   * INSECAM (WARNING - uso ético):
   * Ventaja: Cámaras IP públicas sin protección
   * URL: http://www.insecam.org
   * Desventaja/Warning: Cuestiones éticas y legales
   * SOLO PARA: Investigación de seguridad autorizada
   */

  // ========== TIPS PARA ENCONTRAR CÁMARAS ESTABLES ==========
  
  /*
   * 1. VERIFICAR QUE SEA 24/7:
   *    - Debe decir "Live" o "EN VIVO"
   *    - Check el chat para ver actividad reciente
   *    - Ver si tiene miles de espectadores (más estable)
   * 
   * 2. PREFERIR CANALES OFICIALES:
   *    - Gobierno local
   *    - Departamento de turismo
   *    - Empresas de webcams (EarthCam, etc)
   *    - Aeropuertos oficiales
   * 
   * 3. EVITAR:
   *    - Streams de canales pequeños (pueden caerse)
   *    - Videos con pocos viewers
   *    - Streams que dicen "recorded" o "replay"
   * 
   * 4. TEST ANTES DE AÑADIR:
   *    - Probar el embed en un iframe local
   *    - Verificar que autoplay funcione
   *    - Check que la calidad sea aceptable
   */

  // ========== RECURSOS ÚTILES ==========
  
  /*
   * LISTAS DE WEBCAMS:
   * - https://www.earthcam.com
   * - https://www.webcamtaxi.com
   * - https://www.skylinewebcams.com
   * - https://www.windy.com/webcams
   * 
   * YOUTUBE PLAYLISTS:
   * Buscar: "live cameras playlist"
   * Muchos canales mantienen playlists de streams 24/7
   * 
   * REDDIT:
   * r/LiveCameras
   * r/OSINT
   * r/Webcams
   */
]

/*
 * NOTA IMPORTANTE:
 * 
 * Muchos streams de YouTube son temporales o se caen frecuentemente.
 * Para una aplicación de producción, considera:
 * 
 * 1. USAR APIs DE WEBCAMS PROFESIONALES:
 *    - EarthCam API (pago)
 *    - Windy.com Webcams API
 *    - Government DOT APIs
 * 
 * 2. IMPLEMENTAR FALLBACK:
 *    - Detectar cuando un stream falla
 *    - Mostrar mensaje al usuario
 *    - Ofrecer alternativas
 * 
 * 3. HEALTH CHECKS:
 *    - Verificar periódicamente que los streams funcionan
 *    - Remover automáticamente streams caídos
 *    - Actualizar la lista regularmente
 * 
 * 4. USER CONTRIBUTIONS:
 *    - Permitir que usuarios reporten streams caídos
 *    - Permitir que usuarios sugieran nuevos streams
 *    - Sistema de verificación community-driven
 */