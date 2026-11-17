# Pruebas contra QA

Corren contra https://qaintranet.probusiness.pe (o `QA_BASE_URL`). Crean datos marcados con `[QA-E2E …]` y no borran nada.

```bash
export QA_CHINA_USER=… QA_CHINA_PASS=…            # Encargado China (armando@probusiness.pe)
export QA_SOCIO_USER=… QA_SOCIO_PASS=…            # usuario del socio de prueba
export QA_IMPORTADOR_USER=… QA_IMPORTADOR_PASS=…  # usuario del importador de prueba
# opcionales: QA_VENTAS_USER/PASS, QA_ADMIN_USER/PASS, QA_SOCIO_NAME, QA_IMPORTADOR_NAME
npx playwright test --config=playwright.qa.config.ts --trace off
```

- `china-flow.qa.spec.ts`: operaciones de China → pagos de socio e importador → confirmación (exacta y con diferencia) → caja → estados del socio.
- Helpers en `helpers.ts` (`login`, `rowButton` para tablas con columna fija, `trackApiErrors`).
- Las credenciales nunca van en el repo.
