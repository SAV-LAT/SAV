import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const levels = [
  { id: 'l1', codigo: 'pasante', nombre: 'pasante', deposito: 0, ingreso_diario: 7.20, num_tareas_diarias: 4, comision_por_tarea: 1.80, orden: 0, activo: true },
  { id: 'l2', codigo: 'S1', nombre: 'S1', deposito: 200, ingreso_diario: 7.20, num_tareas_diarias: 4, comision_por_tarea: 1.80, orden: 1, activo: true },
  { id: 'l3', codigo: 'S2', nombre: 'S2', deposito: 720, ingreso_diario: 25.76, num_tareas_diarias: 8, comision_por_tarea: 3.22, orden: 2, activo: true },
  { id: 'l4', codigo: 'S3', nombre: 'S3', deposito: 2830, ingreso_diario: 101.40, num_tareas_diarias: 15, comision_por_tarea: 6.76, orden: 3, activo: true },
  { id: 'l5', codigo: 'S4', nombre: 'S4', deposito: 9150, ingreso_diario: 339.90, num_tareas_diarias: 30, comision_por_tarea: 11.33, orden: 4, activo: false },
  { id: 'l6', codigo: 'S5', nombre: 'S5', deposito: 28200, ingreso_diario: 1045.80, num_tareas_diarias: 60, comision_por_tarea: 17.43, orden: 5, activo: false },
  { id: 'l7', codigo: 'S6', nombre: 'S6', deposito: 58000, ingreso_diario: 2235, num_tareas_diarias: 100, comision_por_tarea: 22.35, orden: 6, activo: false },
  { id: 'l8', codigo: 'S7', nombre: 'S7', deposito: 124000, ingreso_diario: 4961.60, num_tareas_diarias: 160, comision_por_tarea: 31.01, orden: 7, activo: false },
  { id: 'l9', codigo: 'S8', nombre: 'S8', deposito: 299400, ingreso_diario: 11977.50, num_tareas_diarias: 250, comision_por_tarea: 47.91, orden: 8, activo: false },
  { id: 'l10', codigo: 'S9', nombre: 'S9', deposito: 541600, ingreso_diario: 23548, num_tareas_diarias: 400, comision_por_tarea: 58.87, orden: 9, activo: false },
];

export async function initStore() {
  const hash = await bcrypt.hash('123456', 10);
  const hashFondo = await bcrypt.hash('123456', 10);

  const adminId = uuidv4();
  const user1Id = uuidv4();

  const admin = {
    id: adminId,
    telefono: '+59170000000',
    nombre_usuario: 'admin',
    nombre_real: 'Administrador',
    password_hash: await bcrypt.hash('admin123', 10),
    password_fondo_hash: hashFondo,
    codigo_invitacion: 'ADMIN001',
    nivel_id: 'l2', // S1
    rol: 'admin',
    saldo_principal: 0,
    saldo_comisiones: 0,
    bloqueado: false,
  };

  const user1 = {
    id: user1Id,
    telefono: '+59163907641',
    nombre_usuario: 'alexj',
    nombre_real: 'Alexander Jimenez',
    password_hash: hash,
    password_fondo_hash: hashFondo,
    codigo_invitacion: 'VUSBV2GTX',
    invitado_por: null,
    nivel_id: 'l1', // pasante
    saldo_principal: 14.40,
    saldo_comisiones: 28.80,
    rol: 'usuario',
    bloqueado: false,
  };

  // Generamos tareas limpias con nombres reales de marcas y URLs de video
  const tasks = [
    // Tareas Pasante
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Adidas Global', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Nueva campaña Adidas 2026', pregunta: '¿Qué marca viste?', respuesta_correcta: 'ADIDAS', opciones: ['ADIDAS', 'NIKE', 'PUMA', 'REEBOK'] },
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Coca-Cola Summer', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Refrescante sabor Coca-Cola', pregunta: '¿Qué marca viste?', respuesta_correcta: 'COCACOLA', opciones: ['COCACOLA', 'PEPSI', 'SPRITE', 'FANTA'] },
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Chanel Classic', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Elegancia atemporal Chanel', pregunta: '¿Qué marca viste?', respuesta_correcta: 'CHANEL', opciones: ['CHANEL', 'DIOR', 'GUCCI', 'PRADA'] },
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Dior Fashion', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Alta costura con Dior', pregunta: '¿Qué marca viste?', respuesta_correcta: 'DIOR', opciones: ['DIOR', 'CHANEL', 'HERMES', 'PRADA'] },
    
    // Tareas S1
    { id: uuidv4(), nivel_id: 'S1', nombre: 'Nike Air Max', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Innovación en cada paso', pregunta: '¿Qué marca viste?', respuesta_correcta: 'NIKE', opciones: ['NIKE', 'ADIDAS', 'PUMA', 'REEBOK'] },
    { id: uuidv4(), nivel_id: 'S1', nombre: 'Puma Speed', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Diseño y velocidad Puma', pregunta: '¿Qué marca viste?', respuesta_correcta: 'PUMA', opciones: ['PUMA', 'NIKE', 'ADIDAS', 'REEBOK'] },
    { id: uuidv4(), nivel_id: 'S1', nombre: 'Rolex Luxury', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Precisión y prestigio Rolex', pregunta: '¿Qué marca viste?', respuesta_correcta: 'ROLEX', opciones: ['ROLEX', 'OMEGA', 'CASIO', 'CARTIER'] },
    { id: uuidv4(), nivel_id: 'S1', nombre: 'Ferrari F8', recompensa: 1.80, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', descripcion: 'Potencia pura Ferrari', pregunta: '¿Qué marca viste?', respuesta_correcta: 'FERRARI', opciones: ['FERRARI', 'LAMBORGHINI', 'PORSCHE', 'MCLAREN'] },
  ];

  const banners = [
    { id: uuidv4(), imagen_url: '/imag/carrusel1.jpeg', titulo: 'Bienvenido', orden: 0, activo: true },
    { id: uuidv4(), imagen_url: '/imag/carrusel2.jpeg', titulo: 'Gana Diariamente', orden: 1, activo: true },
  ];

  const metodosQr = [
    { id: uuidv4(), nombre_titular: 'SAV Oficial', imagen_qr_url: '', imagen_base64: null, activo: true, orden: 0 },
  ];

  return {
    users: [admin, user1],
    levels,
    tasks,
    metodosQr,
    banners,
    tarjetas: [],
    retiros: [],
    recargas: [],
    transacciones: [],
    notificaciones: [
      { id: uuidv4(), usuario_id: user1Id, titulo: 'Bienvenido', mensaje: '¡Bienvenido a la nueva plataforma SAV!', leida: false },
    ],
    publicContent: {
      home_guide: 'Liderando el futuro publicitario.',
      popup_title: 'Actualización SAV',
      popup_message: 'Hemos mejorado el sistema de tareas para tu comodidad.',
      popup_enabled: true,
      conferencia_title: 'Próximos eventos',
      conferencia_noticias: '• Reunión informativa todos los sábados.',
      horario_recarga: { enabled: false, dias_semana: [1, 2, 3, 4, 5, 6, 0], hora_inicio: '09:00', hora_fin: '18:00' },
      horario_retiro: { enabled: false, dias_semana: [1, 2, 3, 4, 5, 6, 0], hora_inicio: '09:00', hora_fin: '18:00' },
    },
  };
}
