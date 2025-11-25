# 🧪 Pruebas Unitarias - Backend

## Resumen

Este proyecto cuenta con **30 pruebas unitarias** que cubren todos los servicios principales del backend.

## ✅ Estado Actual

- **37 pruebas pasando** (100% exitosas)
  - 30 pruebas unitarias
  - 7 pruebas de integración
- **103 aserciones** verificadas
- **Tiempo de ejecución**: ~2.7 segundos

## 📁 Estructura de Pruebas

```
Back/
├── src/
│   ├── __mocks__/
│   │   ├── test-helpers.ts          # Funciones para crear datos de prueba
│   │   ├── repository.mock.ts       # Mock del DeviceRepository
│   │   └── photo-repository.mock.ts # Mock del PhotoRepository
│   │
│   └── core/
│       └── service/
│           ├── helper.test.ts                    # 6 tests
│           ├── computer.service.test.ts          # 10 tests
│           ├── device.service.test.ts            # 6 tests
│           └── medical-device.service.test.ts    # 8 tests
```

## 🚀 Comandos Disponibles

### Ejecutar todas las pruebas
```bash
bun test
```

### Ejecutar solo pruebas unitarias
```bash
bun run test:unit
```

### Ejecutar pruebas de integración
```bash
bun run test:integration
```

### Modo watch (desarrollo)
```bash
bun run test:watch
```

## 📊 Cobertura por Módulo

| Módulo | Pruebas | Funcionalidades Cubiertas |
|--------|---------|---------------------------|
| **Helper** | 6 | Generación de UUIDs, URLs de QR |
| **ComputerService** | 10 | CRUD de computadoras, check-in/out, validaciones |
| **DeviceService** | 6 | Check-out, listado de dispositivos |
| **MedicalDeviceService** | 8 | Check-in de dispositivos médicos, validaciones |

## 🎯 Funcionalidades Probadas

### ComputerService
- ✅ Obtener computadoras frecuentes
- ✅ Registrar computadoras frecuentes con URLs de QR
- ✅ Check-in de computadoras
- ✅ Manejo de fotos (opcional)
- ✅ Validación de esquemas Zod
- ✅ Manejo de errores

### DeviceService
- ✅ Check-out de dispositivos
- ✅ Listado de dispositivos ingresados
- ✅ Validación de existencia

### MedicalDeviceService
- ✅ Check-in de dispositivos médicos
- ✅ Validación de número de serie
- ✅ Guardado de fotos (obligatorio)
- ✅ Timestamps automáticos

### Helper
- ✅ Generación de UUIDs válidos
- ✅ Generación de URLs dinámicas

## 🔧 Tecnologías

- **Framework de Testing**: Bun Test
- **Mocking**: Bun built-in mocks
- **Validación**: Zod schemas

## 📝 Ejemplo de Uso

```bash
# Ejecutar pruebas unitarias
cd Back
bun run test:unit
```

**Salida esperada:**
```
✓ 30 tests passed
✓ 0 tests failed
✓ 64 expect() calls
Ran 30 tests across 4 files. [~165ms]
```

## 🎉 Beneficios

1. **Desarrollo Seguro**: Las pruebas detectan errores antes de producción
2. **Refactoring Confiable**: Puedes modificar código con confianza
3. **Documentación Viva**: Las pruebas documentan el comportamiento esperado
4. **Ejecución Rápida**: ~165ms para ejecutar todas las pruebas unitarias
5. **Aislamiento**: Mocks permiten probar sin dependencias externas

## 🔍 Próximos Pasos

- [ ] Agregar pruebas para DTOs
- [ ] Aumentar cobertura de casos edge
- [ ] Agregar pruebas de rendimiento
- [ ] Configurar CI/CD para ejecutar pruebas automáticamente

---

**Última actualización**: 2025-11-25  
**Versión**: 1.0.0
