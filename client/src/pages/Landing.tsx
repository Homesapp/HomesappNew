import { Button } from "@/components/ui/button";
import { Building2, Calendar, Users, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">HomesApp</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild data-testid="button-login">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild data-testid="button-register">
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              HomesApp - Plataforma Completa de Gestión Inmobiliaria
            </h2>
            <p className="text-xl text-muted-foreground">
              Administra propiedades, coordina citas, gestiona clientes y servicios
              todo en un solo lugar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="p-6 space-y-2 border rounded-lg">
              <Building2 className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Gestión de Propiedades</h3>
              <p className="text-sm text-muted-foreground">
                Administra tu portafolio completo con detalles, imágenes y estado
              </p>
            </div>

            <div className="p-6 space-y-2 border rounded-lg">
              <Calendar className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Coordinación de Citas</h3>
              <p className="text-sm text-muted-foreground">
                Agenda visitas presenciales y videollamadas con Google Meet
              </p>
            </div>

            <div className="p-6 space-y-2 border rounded-lg">
              <Users className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Multi-Rol</h3>
              <p className="text-sm text-muted-foreground">
                Sistema completo de roles para propietarios, vendedores y más
              </p>
            </div>

            <div className="p-6 space-y-2 border rounded-lg">
              <Shield className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Directorio de Servicios</h3>
              <p className="text-sm text-muted-foreground">
                Marketplace de proveedores para mantenimiento y servicios
              </p>
            </div>
          </div>

          <div className="pt-8 flex gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <Link href="/register">Crear Cuenta Gratis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-get-started-login">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
