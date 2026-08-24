"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Eye, Pencil, Trash2, Mail } from "lucide-react";
import {
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateFormData,
  EmailTemplateCategoryOption,
} from "@/lib/types";
import { mockEmailTemplates } from "@/data/email-templates";

const TEMPLATE_CATEGORIES: EmailTemplateCategoryOption[] = [
  { value: "rh", label: "RH Général" },
  { value: "recrutement", label: "Recrutement" },
  { value: "formation", label: "Formation" },
  { value: "discipline", label: "Discipline" },
  { value: "conges", label: "Congés" },
  { value: "paie", label: "Paie" },
  { value: "medical", label: "Médical" },
  { value: "autre", label: "Autre" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] =
    useState<EmailTemplate[]>(mockEmailTemplates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [formData, setFormData] = useState<EmailTemplateFormData>({
    name: "",
    subject: "",
    body: "",
    category: "rh",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: "", subject: "", body: "", category: "rh", tags: [] });
    setTagInput("");
    setIsDialogOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
      tags: template.tags,
    });
    setTagInput("");
    setIsDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const handleSave = () => {
    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: formData.name,
                subject: formData.subject,
                body: formData.body,
                category: formData.category,
                tags: formData.tags,
                lastModified: new Date().toISOString().split("T")[0],
              }
            : t,
        ),
      );
    } else {
      const newTemplate: EmailTemplate = {
        id: String(Date.now()),
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        category: formData.category,
        tags: formData.tags,
        lastModified: new Date().toISOString().split("T")[0],
      };
      setTemplates([...templates, newTemplate]);
    }
    setIsDialogOpen(false);
  };

  const getCategoryLabel = (category: string) => {
    return (
      TEMPLATE_CATEGORIES.find((c) => c.value === category)?.label || category
    );
  };

  const columns: ColumnDef<EmailTemplate>[] = [
    {
      key: "name",
      label: "Nom du modèle",
      icon: Mail,
      sortable: true,
    },
    {
      key: "subject",
      label: "Objet",
      sortable: true,
      render: (template) => (
        <span className="text-sm text-muted-foreground">
          {template.subject}
        </span>
      ),
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (template) => (
        <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (template) => (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "lastModified",
      label: "Dernière modification",
      sortable: true,
      render: (template) => (
        <span className="text-sm text-muted-foreground">
          {new Date(template.lastModified).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Modèles d&apos;emails
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Gérez vos modèles d&apos;emails RH pour une communication efficace
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={templates}
        columns={columns}
        searchKeys={["name", "subject"]}
        searchPlaceholder="Rechercher un modèle..."
        filters={[
          {
            key: "category",
            label: "Catégorie",
            options: [
              { value: "all", label: "Toutes" },
              ...TEMPLATE_CATEGORIES,
            ],
          },
        ]}
        actions={(template) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handlePreview(template)}
                className="gap-2"
              >
                <Eye className="h-4 w-4 text-green-600" />
                Prévisualiser
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEdit(template)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4 text-orange-500" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(template.id)}
                className="gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type="form"
        title={editingTemplate ? "Modifier le modèle" : "Nouveau modèle"}
        description="Créez ou modifiez un modèle d'email. Utilisez des variables comme {{prenom}}, {{nom}}, {{date}} pour personnaliser vos messages."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsDialogOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingTemplate ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !formData.name || !formData.subject || !formData.body,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du modèle</Label>
            <Input
              id="name"
              placeholder="Ex: Convocation entretien"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value as EmailTemplateCategory,
                })
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              placeholder="Objet de l'email"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Ajouter un tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      if (!formData.tags.includes(tagInput.trim())) {
                        setFormData({
                          ...formData,
                          tags: [...formData.tags, tagInput.trim()],
                        });
                      }
                      setTagInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (
                      tagInput.trim() &&
                      !formData.tags.includes(tagInput.trim())
                    ) {
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, tagInput.trim()],
                      });
                      setTagInput("");
                    }
                  }}
                >
                  Ajouter
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((t) => t !== tag),
                        })
                      }
                    >
                      {tag}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Corps du message</Label>
            <Textarea
              id="body"
              placeholder="Bonjour {{prenom}},&#10;&#10;Votre message ici...&#10;&#10;Cordialement,"
              className="min-h-75 font-mono text-sm"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles : {`{{prenom}}`}, {`{{nom}}`}, {`{{email}}`}
              , {`{{telephone}}`}, {`{{poste}}`}, {`{{departement}}`},{" "}
              {`{{numero_employe}}`}, {`{{date_embauche}}`}, {`{{adresse}}`},{" "}
              {`{{ville}}`}, {`{{code_postal}}`}, {`{{pays}}`}
            </p>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        type="details"
        title="Prévisualisation du modèle"
        description={
          previewTemplate
            ? `${previewTemplate.name} - ${getCategoryLabel(previewTemplate.category)}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsPreviewOpen(false),
          },
        }}
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Objet :
                  </span>
                  <p className="text-sm font-medium">
                    {previewTemplate.subject}
                  </p>
                </div>
                {previewTemplate.tags.length > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Tags :
                      </span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {previewTemplate.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div className="h-px bg-border" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Corps du message :
                  </span>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {previewTemplate.body}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-xs text-blue-900 dark:text-blue-100">
              <p className="font-medium">ℹ️ Aperçu avec des exemples :</p>
              <p className="mt-2 whitespace-pre-wrap">
                {previewTemplate.body
                  .replace(/\{\{prenom\}\}/g, "Jean")
                  .replace(/\{\{nom\}\}/g, "Dupont")
                  .replace(/\{\{email\}\}/g, "jean.dupont@exemple.fr")
                  .replace(/\{\{telephone\}\}/g, "06 12 34 56 78")
                  .replace(/\{\{poste\}\}/g, "Agent de sécurité")
                  .replace(/\{\{departement\}\}/g, "Sécurité")
                  .replace(/\{\{numero_employe\}\}/g, "EMP-2024-001")
                  .replace(/\{\{date_embauche\}\}/g, "01/03/2024")
                  .replace(/\{\{adresse\}\}/g, "123 Rue de la République")
                  .replace(/\{\{ville\}\}/g, "Paris")
                  .replace(/\{\{code_postal\}\}/g, "75001")
                  .replace(/\{\{pays\}\}/g, "France")
                  .replace(/\{\{date\}\}/g, "15/01/2024")
                  .replace(/\{\{heure\}\}/g, "14h30")
                  .replace(/\{\{date_debut\}\}/g, "01/02/2024")
                  .replace(/\{\{date_fin\}\}/g, "07/02/2024")
                  .replace(/\{\{date_expiration\}\}/g, "31/03/2024")}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
