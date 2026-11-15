# Integración con MiCorreo

El cotizador usa la misma secuencia que el [plugin oficial de WooCommerce](https://wordpress.org/plugins/correo-argentino-for-woocommerce/) y la [API de MiCorreo](https://www.correoargentino.com.ar/MiCorreo/public/img/pag/apiMiCorreo.pdf):

1. El servidor pide un JWT con `POST /token` y la credencial de aplicación de producción.
2. Envía `POST /rates` con ese JWT, el ID de cliente, los códigos postales, el tipo de entrega y las medidas del paquete.
3. Conserva el token hasta su vencimiento y cada cotización durante 12 horas desde que recibe la tarifa. Si MiCorreo rechaza el token, lo renueva una vez. Reintenta una vez los fallos transitorios de red en `/token` o `/rates`.

El ID de cliente, origen, peso y medidas se cargan en **Admin → Envíos**. Ya no se pide la contraseña personal de MiCorreo ni una credencial de API por comercio. El cotizador usa siempre producción y necesita `CORREO_ARGENTINO_PRODUCTION_APP_USER` y `CORREO_ARGENTINO_PRODUCTION_APP_PASSWORD` en el servidor para obtener el JWT. Usá la credencial de aplicación autorizada para tu integración. No la subas al repositorio ni la envíes al navegador.

Los campos de credenciales de la tabla `ShippingSettings` son heredados. No se leen y se vacían cuando se guarda la configuración desde el panel. Se conservan en el esquema para evitar una migración que elimine datos en la base compartida.

Desde el mismo panel se habilita domicilio, sucursal o ambos, y se configura un importe fijo adicional. El servidor suma ese importe a cada tarifa de MiCorreo antes de enviarla al comprador; un tipo de entrega desactivado no se puede cotizar aunque se invoque la ruta directamente. El envío gratis sigue mostrando $0 cuando se cumple el umbral.

La migración `20261115000000_shipping_delivery_options` agrega tres columnas tipadas con valores iniciales que conservan el comportamiento anterior: domicilio y sucursal habilitados, importe adicional $0. Aplicala antes de desplegar este cambio. El panel muestra que falta la migración si esas columnas todavía no existen.

La tienda actual cotiza entrega a domicilio o retiro en sucursal; la sucursal concreta se coordina al confirmar por WhatsApp. No hay pedidos persistidos para usar los endpoints de importación o seguimiento de MiCorreo.
