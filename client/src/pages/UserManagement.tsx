import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCog, UserPlus } from "lucide-react";
import { UsersTab } from "@/components/admin/UsersTab";
import { RoleRequestsTab } from "@/components/admin/RoleRequestsTab";
import { CreateUserTab } from "@/components/admin/CreateUserTab";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-user-management">
          Gestión de Usuarios y Roles
        </h1>
        <p className="text-muted-foreground">
          Administra usuarios, solicitudes de roles y crea nuevas cuentas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="role-requests" data-testid="tab-role-requests">
            <UserCog className="h-4 w-4 mr-2" />
            Solicitudes de Roles
          </TabsTrigger>
          <TabsTrigger value="create-user" data-testid="tab-create-user">
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="role-requests" className="mt-6">
          <RoleRequestsTab />
        </TabsContent>

        <TabsContent value="create-user" className="mt-6">
          <CreateUserTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
