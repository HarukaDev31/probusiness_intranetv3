export default defineNuxtPlugin(() => {
  // Evitar doble inserción
  if (document.getElementById('fa-stylesheet')) return

  // Preconnect y preload para reducir FOUC de iconos
  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = 'https://cdnjs.cloudflare.com'
  document.head.appendChild(preconnect)

  const preload = document.createElement('link')
  preload.rel = 'preload'
  preload.as = 'style'
  preload.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  document.head.appendChild(preload)

  const link = document.createElement('link')
  link.id = 'fa-stylesheet'
  link.rel = 'stylesheet'
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  link.media = 'print'
  link.onload = () => { link.media = 'all' }
  document.head.appendChild(link)
}) 