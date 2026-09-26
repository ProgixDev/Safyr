"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileSearch,
  CheckCircle2,
  FileText,
  Download,
  Calendar,
  Users,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

type RegisterType =
  | "personnel"
  | "sanctions"
  | "workAccidents"
  | "trainings"
  | "cdd";

interface ExportConfig {
  registerType: RegisterType;
  label: string;
  description: string;
  icon: typeof Users;
  enabled: boolean;
}

export default function LegalRegistersExportPage() {
  const [selectedRegisters, setSelectedRegisters] = useState<Set<RegisterType>>(
    new Set(["personnel"]),
  );
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<"all" | "year" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const registers: ExportConfig[] = [
    {
      registerType: "personnel",
      label: "Registre du Personnel",
      description: "Registre unique du personnel (obligatoire)",
      icon: Users,
      enabled: true,
    },
    {
      registerType: "sanctions",
      label: "Registre des Sanctions",
      description: "Historique des sanctions disciplinaires",
      icon: AlertTriangle,
      enabled: true,
    },
    {
      registerType: "workAccidents",
      label: "Registre des Accidents du Travail",
      description: "Déclarations et suivi des accidents",
      icon: AlertTriangle,
      enabled: true,
    },
    {
      registerType: "trainings",
      label: "Registre de formation",
      description: "Formations réalisées et certifications du personnel",
      icon: GraduationCap,
      enabled: true,
    },
    {
      registerType: "cdd",
      label: "Registre CDD Entrées/Sorties",
      description: "Suivi des contrats à durée déterminée",
      icon: FileText,
      enabled: true,
    },
  ];

  const toggleRegister = (registerType: RegisterType) => {
    const newSelected = new Set(selectedRegisters);
    if (newSelected.has(registerType)) {
      newSelected.delete(registerType);
    } else {
      newSelected.add(registerType);
    }
    setSelectedRegisters(newSelected);
  };

  const handleExport = () => {
    const registerLabels = Array.from(selectedRegisters)
      .map((rt) => registers.find((r) => r.registerType === rt)?.label)
      .join(", ");

    alert(
      `Export ${exportFormat.toUpperCase()} en cours...\n\nRegistres sélectionnés:\n${registerLabels}\n\nPériode: ${dateRange === "all" ? "Toutes les données" : dateRange === "year" ? "Année en cours" : `${startDate} - ${endDate}`}\n\nFormat: ${exportFormat === "pdf" ? "PDF conforme inspection du travail/CNAPS" : "Excel"}`,
    );
  };

  const handleExportAll = () => {
    const allRegisters = new Set<RegisterType>(
      registers.map((r) => r.registerType),
    );
    setSelectedRegisters(allRegisters);
    setTimeout(() => {
      handleExport();
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exports Réglementaires</h1>
          <p className="text-muted-foreground">
            Génération des registres légaux conformes à la réglementation
          </p>
        </div>
        <Button onClick={handleExportAll} size="lg">
          <Download className="mr-2 h-4 w-4" />
          Exporter tous les registres
        </Button>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={FileSearch}
          title="Registres disponibles"
          value={registers.length}
          subtext="Registres réglementaires"
          color="gray"
        />

        <InfoCard
          icon={CheckCircle2}
          title="Sélectionnés"
          value={selectedRegisters.size}
          subtext="Pour l'export en cours"
          color="blue"
        />

        <InfoCard
          icon={FileText}
          title="Format"
          value={exportFormat.toUpperCase()}
          subtext={exportFormat === "pdf" ? "Conforme CNAPS" : "Tableur"}
          color="green"
        />
      </InfoCardContainer>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sélection des registres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {registers.map((register) => {
                  const Icon = register.icon;
                  const isSelected = selectedRegisters.has(
                    register.registerType,
                  );

                  return (
                    <div
                      key={register.registerType}
                      className={`flex items-start space-x-3 p-4 rounded-lg border ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      } hover:border-primary/50 transition-colors cursor-pointer`}
                      onClick={() => toggleRegister(register.registerType)}
                    >
                      <Checkbox
                        id={register.registerType}
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleRegister(register.registerType)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor={register.registerType}
                            className="font-medium cursor-pointer"
                          >
                            {register.label}
                          </Label>
                          {register.registerType === "personnel" && (
                            <Badge variant="destructive" className="ml-2">
                              Obligatoire
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {register.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">
                Conformité réglementaire
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <p>
                  Exports conformes aux exigences de l&apos;inspection du
                  travail
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <p>Format PDF adapté aux contrôles CNAPS</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <p>Conservation des données selon les obligations légales</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <p>Horodatage et traçabilité des exports</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Options d&apos;export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exportFormat">Format de fichier</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) =>
                    setExportFormat(value as "pdf" | "excel")
                  }
                >
                  <SelectTrigger id="exportFormat" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF (Réglementaire)</SelectItem>
                    <SelectItem value="excel">Excel (Analyse)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {exportFormat === "pdf"
                    ? "Recommandé pour les contrôles officiels"
                    : "Pour analyses et tableaux croisés"}
                </p>
              </div>

              <div>
                <Label htmlFor="dateRange">Période</Label>
                <Select
                  value={dateRange}
                  onValueChange={(value) =>
                    setDateRange(value as "all" | "year" | "custom")
                  }
                >
                  <SelectTrigger id="dateRange" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="year">Année en cours</SelectItem>
                    <SelectItem value="custom">
                      Période personnalisée
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleExport}
                className="w-full"
                size="lg"
                disabled={selectedRegisters.size === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Générer l&apos;export
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Exports rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedRegisters(new Set(["personnel"]));
                  setExportFormat("pdf");
                  setDateRange("all");
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Registre du personnel
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedRegisters(new Set(["workAccidents"]));
                  setExportFormat("pdf");
                  setDateRange("year");
                }}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Accidents (année)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedRegisters(new Set(["trainings"]));
                  setExportFormat("pdf");
                  setDateRange("year");
                }}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Formations (année)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedRegisters(new Set(["cdd"]));
                  setExportFormat("pdf");
                  setDateRange("all");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Registre CDD
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
