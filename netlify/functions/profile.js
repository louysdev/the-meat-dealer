import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para generar meta tags dinámicos para perfiles compartidos
export const handler = async (event, context) => {
  const { path } = event;
  
  // Verificar si es una URL de perfil
  const profileMatch = path.match(/^\/profile\/(.+)$/);
  
  if (!profileMatch) {
    return {
      statusCode: 404,
      body: 'Profile not found'
    };
  }
  
  const profileId = profileMatch[1];
  
  try {
    // Obtener el perfil de Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        profile_photos(photo_url, video_url, media_type, photo_order)
      `)
      .eq('id', profileId)
      .single();
    
    if (error || !profile) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/html'
        },
        body: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Perfil no encontrado | The Meat Dealer</title>
    <script>window.location.href = '/';</script>
</head>
<body>
    <p>Perfil no encontrado. Redirigiendo...</p>
</body>
</html>`
      };
    }
    
    // Procesar media
    const photos = profile.profile_photos
      ?.filter(p => p.media_type === 'photo')
      ?.sort((a, b) => a.photo_order - b.photo_order)
      ?.map(p => p.photo_url) || [];
    
    const videos = profile.profile_photos
      ?.filter(p => p.media_type === 'video')
      ?.sort((a, b) => a.photo_order - b.photo_order)
      ?.map(p => p.video_url) || [];
    
    const title = `${profile.first_name} ${profile.last_name} - ${profile.age} años | The Meat Dealer`;
    const description = profile.residence 
      ? `Perfil de ${profile.first_name} de ${profile.residence}` 
      : `Perfil de ${profile.first_name}`;
    const image = photos[0] || videos[0] || 'https://the-meat-dealer.netlify.app/banner.jpeg';
    const url = `https://the-meat-dealer.netlify.app/profile/${profileId}`;
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:site_name" content="The Meat Dealer">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">
    <meta property="twitter:site" content="@themeatdealer">
    
    <!-- WhatsApp optimizations -->
    <meta property="og:image:alt" content="Foto de ${profile.first_name} ${profile.last_name}">
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loading {
            text-align: center;
            padding: 40px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #ef4444;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    
    <!-- Redirect to main app -->
    <script>
      // Redirigir a la aplicación principal después de un breve delay
      setTimeout(() => {
        window.location.href = '/#/profile/${profileId}';
      }, 1000);
    </script>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h2>Cargando perfil de ${profile.first_name}</h2>
        <p>Redirigiendo a la aplicación...</p>
    </div>
</body>
</html>`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        'X-Robots-Tag': 'noindex, nofollow' // No indexar estas páginas temporales
      },
      body: html
    };
    
  } catch (error) {
    console.error('Error generating profile page:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Error | The Meat Dealer</title>
    <script>window.location.href = '/';</script>
</head>
<body>
    <p>Error al cargar el perfil. Redirigiendo...</p>
</body>
</html>`
    };
  }
};
