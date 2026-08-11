"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Zap } from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

const mockRules: AutomationRule[] = [];

export default function WorkflowAutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>(mockRules);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    trigger: "",
    condition: "",
    action: "",
    isActive: true,
  });

  const columns: ColumnDef<AutomationRule>[] = [
    {
      key: "name",
      label: "Nom de la règle",
      sortable: true,
    },
    {
      key: "trigger",
      label: "Déclencheur",
      render: (rule) => (
        <span className="text-sm text-muted-foreground">{rule.trigger}</span>
      ),
    },
    {
      key: "triggerCount",
      label: "Exécutions",
      render: (rule) => <Badge variant="secondary">{rule.triggerCount}</Badge>,
    },
    {
      key: "lastTriggered",
      label: "Dernière exécution",
      render: (rule) => (
        <span className="text-sm">
          {rule.lastTriggered
            ? new Date(rule.lastTriggered).toLocaleDateString("fr-FR")
            : "-"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Statut",
      render: (rule) => (
        <Badge variant={rule.isActive ? "default" : "outline"}>
          {rule.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({
      name: "",
      trigger: "",
      condition: "",
      action: "",
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = () => {
    const newRule: AutomationRule = {
      id: (rules.length + 1).toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };
    setRules([...rules, newRule]);
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setIsViewModalOpen(true);
  };

  const handleToggleActive = (ruleId: string) => {
    setRules(
      rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)),
    );
  };

  const activeRules = rules.filter((r) => r.isActive).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.triggerCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automatisation des Workflows</h1>
          <p className="text-muted-foreground">
            Configuration des règles d&apos;automatisation selon les règles RH
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Règles actives
            </CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRules}</div>
            <p className="text-xs text-muted-foreground">
              sur {rules.length} règles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total exécutions
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Toutes règles confondues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de réussite
            </CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Exécutions réussies</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={rules}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Rechercher une règle..."
        onRowClick={handleRowClick}
      />

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title="Nouvelle règle d'automatisation"
        size="lg"
        actions={{
          primary: {
            label: "Créer",
            onClick: handleSave,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la règle</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Auto-validation congés courts"
            />
          </div>

          <div>
            <Label htmlFor="trigger">Déclencheur</Label>
            <Select
              value={formData.trigger}
              onValueChange={(value) =>
                setFormData({ ...formData, trigger: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un déclencheur..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leave_request">
                  Demande de congé créée
                </SelectItem>
                <SelectItem value="contract_signed">Contrat signé</SelectItem>
                <SelectItem value="certification_expired">
                  Certification expirée
                </SelectItem>
                <SelectItem value="training_completed">
                  Formation complétée
                </SelectItem>
                <SelectItem value="absence_declared">
                  Absence déclarée
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Input
              id="condition"
              value={formData.condition}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
              placeholder="Ex: Durée ≤ 3 jours ET Solde suffisant"
            />
          </div>

          <div>
            <Label htmlFor="action">Action</Label>
            <Select
              value={formData.action}
              onValueChange={(value) =>
                setFormData({ ...formData, action: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_validate">
                  Valider automatiquement
                </SelectItem>
                <SelectItem value="send_email">Envoyer un email</SelectItem>
                <SelectItem value="send_notification">
                  Envoyer une notification
                </SelectItem>
                <SelectItem value="create_task">Créer une tâche</SelectItem>
                <SelectItem value="update_status">
                  Mettre à jour le statut
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Label>Activer la règle</Label>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la règle"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedRule && (
          <div className="space-y-4">
            <div>
              <Label>Nom de la règle</Label>
              <p className="text-sm font-medium">{selectedRule.name}</p>
            </div>

            <div>
              <Label>Déclencheur</Label>
              <p className="text-sm font-medium">{selectedRule.trigger}</p>
            </div>

            <div>
              <Label>Condition</Label>
              <p className="text-sm font-medium">{selectedRule.condition}</p>
            </div>

            <div>
              <Label>Action</Label>
              <p className="text-sm font-medium">{selectedRule.action}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Date de création</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedRule.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Dernière exécution</Label>
                <p className="text-sm font-medium">
                  {selectedRule.lastTriggered
                    ? new Date(selectedRule.lastTriggered).toLocaleDateString(
                        "fr-FR",
                      )
                    : "Jamais"}
                </p>
              </div>
            </div>

            <div>
              <Label>Nombre d&apos;exécutions</Label>
              <p className="text-2xl font-bold">{selectedRule.triggerCount}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Statut</Label>
              <Badge variant={selectedRule.isActive ? "default" : "outline"}>
                {selectedRule.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleToggleActive(selectedRule.id);
                setIsViewModalOpen(false);
              }}
            >
              {selectedRule.isActive ? "Désactiver" : "Activer"} la règle
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
