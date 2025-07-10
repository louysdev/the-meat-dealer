// Script temporal para otorgar acceso a todos los perfiles de videos privados
// Ejecutar desde la consola del navegador en la app

import { grantPrivateVideoAccess } from './src/services/privateVideoService.js';

// ID del usuario administrador
const adminUserId = 'bbf109ed-2e55-444d-b83e-624046934580';

// IDs de los perfiles obtenidos de la consulta anterior
const profileIds = [
  'fc544902-19bc-430f-b183-4460de81197f', // Anonimo
  '4afe64d4-b7dd-41e8-88cf-f40c1dcf4457', // Contenido Privado Anónimo (XL)
  'f27c0b53-595d-4c10-979b-59d53f73a028', // Contenido Privado Anónimo (M)
  '172fb71c-51e4-4c8c-a1ab-ab0a631861ff'  // Contenido Privado de Yokarys Mercedes
];

// Otorgar acceso completo (ver y subir) a todos los perfiles
async function grantAccessToAll() {
  for (const profileId of profileIds) {
    try {
      await grantPrivateVideoAccess(adminUserId, profileId, true, true, adminUserId);
      console.log(`✅ Acceso otorgado para perfil: ${profileId}`);
    } catch (error) {
      console.error(`❌ Error otorgando acceso para perfil ${profileId}:`, error);
    }
  }
}

// Ejecutar
grantAccessToAll().then(() => {
  console.log('🎉 Proceso completado');
}).catch(error => {
  console.error('💥 Error en el proceso:', error);
});
