# CientiFitness Manager

App web estática + Supabase (login y base de datos).

- `index.html` — la app
- `config.js` — URL y clave pública de Supabase
- `supabase.sql` — crea la tabla `cf_state` con seguridad por usuario
- `data/alimentos.js` — base de 307 alimentos

## Agenda y Google Calendar

Sin configurar nada, cada cita tiene «Añadir a Google Calendar» y puedes exportar todas en .ics.

Para que las citas se copien solas en tu Google Calendar (se hace una vez, ~10 min):

1. Entra en https://console.cloud.google.com con tu cuenta de Google y crea un proyecto (p. ej. «CientiFitness»).
2. Menú ☰ → «APIs y servicios» → «Biblioteca» → busca **Google Calendar API** → «Habilitar».
3. «APIs y servicios» → «Pantalla de consentimiento de OAuth»: tipo **Externo**, nombre de la app «CientiFitness», tu email. En «Usuarios de prueba» añade elcientifitness@gmail.com.
4. «APIs y servicios» → «Credenciales» → «Crear credenciales» → **ID de cliente de OAuth** → tipo «Aplicación web».
   En «Orígenes de JavaScript autorizados» añade: https://prueba-de-app-movil.vercel.app
5. Copia el «ID de cliente» y pégalo en config.js, entre las comillas de googleClientId. Sube config.js a GitHub.
6. En la app: Agenda → «Conectar Google Calendar». El permiso dura 1 hora; después pulsa «Sincronizar ahora» otra vez.


## App de asesorados (chat, registro diario, fotos)

Se hace una sola vez:

1. Supabase → SQL Editor → New query → pega el contenido de **portal.sql** → Run.
2. Supabase → Authentication → URL Configuration → en **Redirect URLs** añade `https://prueba-de-app-movil.vercel.app/asesorado.html`.

Para cada asesorado:

1. En su ficha, escribe su **email**.
2. Vista cliente → «App del asesorado» → **Publicar en la app**. Cada vez que cambies el plan, vuelve a publicar.
3. Pulsa **Invitar**: se copia el email y se abre Supabase → Add user → **Send invitation** → pega el email.
4. El asesorado abre el email, crea su contraseña y entra en `/asesorado.html` (puede añadirla a la pantalla de inicio del móvil).

Los mensajes aparecen en **Mensajes** (menú lateral), junto con su registro de comidas y el cuestionario diario.
