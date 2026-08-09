"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Package,
  Users,
  Send,
  Route,
  Gavel,
  DollarSign,
  Gift,
  FileSignature,
} from "lucide-react";
import { useEmployee } from "@/hooks/employees";
import { toUiEmployee } from "@/lib/employee-adapter";
import {
  EmployeeInfoTab,
  EmployeeDocumentsTab,
  EmployeeContractsTab,
  EmployeeAvantageTab,
  EmployeeEquipmentTab,
  EmployeeBadgesTab,
  EmployeeCSETab,
  EmployeeDisciplineTab,
  EmployeeSavingsTab,
  EmployeeGeolocationTab,
} from "@/components/employees";
import { useSendEmail } from "@/hooks/useSendEmail";

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  // ?tab=documents permet d'arriver directement sur un onglet depuis le menu
  // d'actions de la liste des dossiers salariés.
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") ?? "info",
  );
  const { data: apiEmployee, isLoading } = useEmployee(id);
  const employee = apiEmployee ? toUiEmployee(apiEmployee) : null;
  const { openEmailModal } = useSendEmail();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <h1 className="text-2xl font-bold mb-2">Employé non trouvé</h1>
        <p className="text-muted-foreground mb-4">
          L&apos;employé avec l&apos;ID {id} n&apos;existe pas.
        </p>
        <Button asChild>
          <Link href="/dashboard/hr/collaborators">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "info" as const, label: "Informations", icon: FileText },
    { id: "documents" as const, label: "Documents", icon: FileText },
    { id: "contracts" as const, label: "Contrats", icon: FileText },
    { id: "avantage" as const, label: "Avantages", icon: Gift },
    { id: "equipment" as const, label: "Équipements", icon: Package },
    { id: "badges" as const, label: "Badges", icon: FileSignature },
    { id: "savings" as const, label: "Épargne", icon: DollarSign },
    { id: "discipline" as const, label: "Discipline", icon: Gavel },
    { id: "cse" as const, label: "CSE", icon: Users },
    { id: "geolocation" as const, label: "Géolocalisation", icon: MapPin },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.id} value={tab.id}>
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/hr/collaborators">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-muted-foreground">
              {employee.position} • {employee.employeeNumber}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link
                href={`/dashboard/hr/lifecycle/onboarding?employee=${employee.id}`}
              >
                <Route className="mr-2 h-4 w-4" />
                Parcours d&apos;intégration
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => openEmailModal([employee])}
            >
              <Send className="mr-2 h-4 w-4" />
              Envoyer un email
            </Button>
          </div>
        </div>

        {/* Employee Overview Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6 flex-wrap">
              <Avatar className="h-24 w-24">
                <AvatarImage src={employee.photo} alt={employee.firstName} />
                <AvatarFallback className="text-2xl">
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-w-0">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date d&apos;embauche
                    </p>
                    <p className="font-medium">
                      {employee.hireDate.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Localisation
                    </p>
                    <p className="font-medium">
                      {employee.address.city}, {employee.address.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <TabsContent value="info">
          <EmployeeInfoTab employee={employee} />
        </TabsContent>
        <TabsContent value="documents">
          <EmployeeDocumentsTab employee={employee} />
        </TabsContent>
        <TabsContent value="contracts">
          <EmployeeContractsTab employee={employee} />
        </TabsContent>
        <TabsContent value="avantage">
          <EmployeeAvantageTab employee={employee} />
        </TabsContent>
        <TabsContent value="equipment">
          <EmployeeEquipmentTab employee={employee} />
        </TabsContent>
        <TabsContent value="badges">
          <EmployeeBadgesTab employee={employee} />
        </TabsContent>
        <TabsContent value="savings">
          <EmployeeSavingsTab employee={employee} />
        </TabsContent>
        <TabsContent value="discipline">
          <EmployeeDisciplineTab employee={employee} />
        </TabsContent>
        <TabsContent value="cse">
          <EmployeeCSETab employee={employee} />
        </TabsContent>
        <TabsContent value="geolocation">
          <EmployeeGeolocationTab employee={employee} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
