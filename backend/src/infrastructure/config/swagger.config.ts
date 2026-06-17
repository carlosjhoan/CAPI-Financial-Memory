import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Personal Finance Manager API")
    .setDescription(
      `API para el sistema de gestión de finanzas personales (PFM). 
      
## Características principales:
- **Gestión de Deudas**: Registro, seguimiento y pagos de deudas
- **Control de Gastos**: Registro y análisis de gastos personales
- **Seguimiento de Ingresos**: Registro y análisis de ingresos
- **Administración de Préstamos**: Gestión de préstamos otorgados a terceros

## Endpoints disponibles:
- **/api/debts**: Operaciones CRUD para deudas
- **/api/expenses**: Operaciones CRUD para gastos
- **/api/incomes**: Operaciones CRUD para ingresos
- **/api/loans**: Operaciones CRUD para préstamos
- **/api/pockets**: Operaciones CRUD para bolsillos de ahorro

## Respuestas estándar:
Todas las respuestas siguen el formato \`ApiResponse<T>\` que incluye:
- \`statusCode\`: Código HTTP
- \`data\`: Datos de la respuesta
- \`message\`: Mensaje descriptivo
- \`timestamp\`: Fecha y hora de la respuesta

Para errores se utiliza el formato \`ErrorResponse\` con información detallada del error.`,
    )
    .setVersion("1.0")
    .addTag("debts", "Operaciones relacionadas con deudas")
    .addTag("expenses", "Operaciones relacionadas con gastos")
    .addTag("incomes", "Operaciones relacionadas con ingresos")
    .addTag("loans", "Operaciones relacionadas con préstamos")
    .addTag("pockets", "Operaciones relacionadas con bolsillos de ahorro")
    .addServer("http://localhost:3000", "Servidor de desarrollo")
    .addServer("https://api.pfm.example.com", "Servidor de producción")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Ingrese el token JWT en el formato: Bearer <token>",
      },
      "access-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Personal Finance Manager API",
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });
}
