/**
 * Orgs socio sin Meta propio: el backend no envía por WhatsApp y devuelve
 * `data.download_url` con un ZIP de rotulado. Dispara la descarga en el navegador.
 */
export const descargarRotuladoSiAplica = (response: any): void => {
    const url = response?.data?.download_url
    if (!url || typeof window === 'undefined') return
    const link = document.createElement('a')
    link.href = url
    link.download = response?.data?.filename || 'Rotulado.zip'
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
