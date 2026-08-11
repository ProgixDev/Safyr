"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Archive, Search, Database } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { mockLogbookEvents, type LogbookEvent } from "@/data/logbook-events";
import { getStatusLabel } from "@/lib/logbook-utils";

interface Export {
  id: string;
  type: "PDF" | "Excel" | "CSV";
  format: "daily" | "weekly" | "monthly" | "custom";
  createdAt: string;
  status: "completed" | "processing" | "failed";
  fileSize?: string;
  downloadUrl?: string;
}

interface Archive {
  id: string;
  name: string;
  period: string;
  eventCount: number;
  archivedAt: string;
  retentionUntil: string;
}

const mockExports: Export[] = [];

const mockArchives: Archive[] = [];

function getDateRange(period: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "today":
      return { from: today, to: new Date(today.getTime() + 86400000 - 1) };
    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1),
        to: now,
      };
    }
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    default:
      return { from: null, to: null };
  }
}

export default function ExportsPage() {
  const [activeTab, setActiveTab] = useState<"exports" | "archives" | "search">(
    "exports",
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    type: "PDF",
    format: "daily",
    site: "all",
    startDate: "",
    endDate: "",
  });

  const [exportDateFilter, setExportDateFilter] = useState<string>("all");
  const [exportCustomStart, setExportCustomStart] = useState<string>("");
  const [exportCustomEnd, setExportCustomEnd] = useState<string>("");

  const [searchFilters, setSearchFilters] = useState({
    site: "all",
    type: "all",
    startDate: "",
    endDate: "",
    agent: "",
    severity: "all",
  });
  const [searchResults, setSearchResults] = useState<LogbookEvent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredExports = mockExports.filter((exp) => {
    if (exportDateFilter === "all") return true;
    const created = new Date(exp.createdAt);
    if (exportDateFilter === "custom") {
      if (exportCustomStart && created < new Date(exportCustomStart))
        return false;
      if (exportCustomEnd && created > new Date(exportCustomEnd + "T23:59:59"))
        return false;
      return true;
    }
    const { from, to } = getDateRange(exportDateFilter);
    if (from && created < from) return false;
    if (to && created > to) return false;
    return true;
  });

  const handleSearch = () => {
    let results = [...mockLogbookEvents];
    if (searchFilters.site !== "all")
      results = results.filter((e) => e.siteId === searchFilters.site);
    if (searchFilters.type !== "all")
      results = results.filter((e) => e.type === searchFilters.type);
    if (searchFilters.severity !== "all")
      results = results.filter((e) => e.severity === searchFilters.severity);
    if (searchFilters.agent)
      results = results.filter((e) =>
        e.agentName.toLowerCase().includes(searchFilters.agent.toLowerCase()),
      );
    if (searchFilters.startDate)
      results = results.filter(
        (e) => new Date(e.timestamp) >= new Date(searchFilters.startDate),
      );
    if (searchFilters.endDate)
      results = results.filter(
        (e) =>
          new Date(e.timestamp) <=
          new Date(searchFilters.endDate + "T23:59:59"),
      );
    setSearchResults(results);
    setHasSearched(true);
  };

  const exportColumns: ColumnDef<Export>[] = [
    {
      key: "type",
      label: "Type",
      render: (export_) => <Badge variant="outline">{export_.type}</Badge>,
    },
    {
      key: "format",
      label: "Format",
      render: (export_) => {
        const labels: Record<string, string> = {
          daily: "Quotidien",
          weekly: "Hebdomadaire",
          monthly: "Mensuel",
          custom: "Personnalisé",
        };
        return <span>{labels[export_.format] || export_.format}</span>;
      },
    },
    {
      key: "createdAt",
      label: "Créé le",
      render: (export_) => new Date(export_.createdAt).toLocaleString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (export_) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          completed: "default",
          processing: "secondary",
          failed: "destructive",
        };
        return (
          <Badge variant={variants[export_.status]}>
            {getStatusLabel(export_.status)}
          </Badge>
        );
      },
    },
    {
      key: "fileSize",
      label: "Taille",
      render: (export_) => export_.fileSize || "-",
    },
    {
      key: "actions",
      label: "Actions",
      render: (export_) => (
        <Button
          variant="outline"
          size="sm"
          disabled={export_.status !== "completed"}
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      ),
    },
  ];

  const archiveColumns: ColumnDef<Archive>[] = [
    {
      key: "name",
      label: "Nom",
      render: (archive) => <span className="font-medium">{archive.name}</span>,
    },
    {
      key: "period",
      label: "Période",
    },
    {
      key: "eventCount",
      label: "Événements",
      render: (archive) => (
        <Badge variant="outline">{archive.eventCount}</Badge>
      ),
    },
    {
      key: "archivedAt",
      label: "Archivé le",
      render: (archive) =>
        new Date(archive.archivedAt).toLocaleDateString("fr-FR"),
    },
    {
      key: "retentionUntil",
      label: "Conservation jusqu&apos;au",
      render: (archive) =>
        new Date(archive.retentionUntil).toLocaleDateString("fr-FR"),
    },
  ];

  const handleGenerateExport = () => {
    alert("Génération de l'export en cours...");
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Rapports
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Rapports paramétrables, exports PDF/Excel/CSV et archivage légal 10
            ans
          </p>
        </div>
        <Button onClick={() => setIsExportModalOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Nouvel export
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "exports" ? "default" : "ghost"}
          onClick={() => setActiveTab("exports")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Rapports
        </Button>
        <Button
          variant={activeTab === "archives" ? "default" : "ghost"}
          onClick={() => setActiveTab("archives")}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archivage
        </Button>
        <Button
          variant={activeTab === "search" ? "default" : "ghost"}
          onClick={() => setActiveTab("search")}
        >
          <Search className="h-4 w-4 mr-2" />
          Recherche avancée
        </Button>
      </div>

      {/* Exports Tab */}
      {activeTab === "exports" && (
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-light flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapports disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div className="w-48">
                <Label className="mb-1 block text-sm">Période</Label>
                <Select
                  value={exportDateFilter}
                  onValueChange={setExportDateFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                    <SelectItem value="today">{"Aujourd'hui"}</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exportDateFilter === "custom" && (
                <>
                  <div>
                    <Label className="mb-1 block text-sm">Du</Label>
                    <Input
                      type="date"
                      value={exportCustomStart}
                      onChange={(e) => setExportCustomStart(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Au</Label>
                    <Input
                      type="date"
                      value={exportCustomEnd}
                      onChange={(e) => setExportCustomEnd(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </>
              )}
            </div>
            <DataTable
              data={filteredExports}
              columns={exportColumns}
              searchKey="type"
              searchPlaceholder="Rechercher un export..."
            />
          </CardContent>
        </Card>
      )}

      {/* Archives Tab */}
      {activeTab === "archives" && (
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-light flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archivage légal (10 ans)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Archivage automatique
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conservation légale de 10 ans • Sauvegardes sécurisées
                  </p>
                </div>
              </div>
            </div>
            <DataTable
              data={mockArchives}
              columns={archiveColumns}
              searchKey="name"
              searchPlaceholder="Rechercher une archive..."
            />
          </CardContent>
        </Card>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-light flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recherche multicritère avancée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="searchSite">Site</Label>
                  <Select
                    value={searchFilters.site}
                    onValueChange={(v) =>
                      setSearchFilters({ ...searchFilters, site: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les sites</SelectItem>
                      <SelectItem value="SITE-001">
                        Centre Commercial Atlantis
                      </SelectItem>
                      <SelectItem value="SITE-002">
                        Tour de Bureaux Skyline
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="searchType">{"Type d'événement"}</Label>
                  <Select
                    value={searchFilters.type}
                    onValueChange={(v) =>
                      setSearchFilters({ ...searchFilters, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="control">Contrôle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="searchStartDate">Date début</Label>
                  <Input
                    id="searchStartDate"
                    type="date"
                    value={searchFilters.startDate}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="searchEndDate">Date fin</Label>
                  <Input
                    id="searchEndDate"
                    type="date"
                    value={searchFilters.endDate}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="searchAgent">Agent</Label>
                  <Input
                    id="searchAgent"
                    placeholder="Nom de l'agent..."
                    value={searchFilters.agent}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        agent: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="searchSeverity">Gravité</Label>
                  <Select
                    value={searchFilters.severity}
                    onValueChange={(v) =>
                      setSearchFilters({ ...searchFilters, severity: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    alert(
                      `Export de ${searchResults.length} résultat(s) en cours...`,
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter résultats
                </Button>
              </div>

              {hasSearched && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {searchResults.length} résultat(s) trouvé(s)
                  </p>
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{event.type}</Badge>
                            <span className="font-medium">{event.title}</span>
                            <span className="text-muted-foreground">
                              {event.site}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{event.agentName}</span>
                            <span>
                              {new Date(event.timestamp).toLocaleString(
                                "fr-FR",
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Modal */}
      <Modal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        type="form"
        title="Nouvel export"
        size="lg"
        actions={{
          primary: {
            label: "Générer",
            onClick: handleGenerateExport,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsExportModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="exportType">Type d&apos;export</Label>
            <Select
              value={exportConfig.type}
              onValueChange={(value) =>
                setExportConfig({ ...exportConfig, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Excel">Excel</SelectItem>
                <SelectItem value="CSV">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exportFormat">Format</Label>
            <Select
              value={exportConfig.format}
              onValueChange={(value) => {
                const today = new Date().toISOString().split("T")[0];
                const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
                  .toISOString()
                  .split("T")[0];
                const firstOfMonth = new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                )
                  .toISOString()
                  .split("T")[0];
                let startDate = exportConfig.startDate;
                let endDate = exportConfig.endDate;
                if (value === "daily") {
                  startDate = today;
                  endDate = today;
                } else if (value === "weekly") {
                  startDate = sevenDaysAgo;
                  endDate = today;
                } else if (value === "monthly") {
                  startDate = firstOfMonth;
                  endDate = today;
                }
                setExportConfig({
                  ...exportConfig,
                  format: value,
                  startDate,
                  endDate,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">Date début</Label>
            <Input
              id="startDate"
              type="date"
              value={exportConfig.startDate}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  startDate: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="endDate">Date fin</Label>
            <Input
              id="endDate"
              type="date"
              value={exportConfig.endDate}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  endDate: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="exportSite">Site</Label>
            <Select
              value={exportConfig.site}
              onValueChange={(value) =>
                setExportConfig({ ...exportConfig, site: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sites</SelectItem>
                <SelectItem value="SITE-001">
                  Centre Commercial Atlantis
                </SelectItem>
                <SelectItem value="SITE-002">
                  Tour de Bureaux Skyline
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
