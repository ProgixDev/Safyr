"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, TrendingUp, Mail, Share2 } from "lucide-react";
import {
  mockSocialPosts,
  mockEmailAutoReplies,
  mockCRMCustomers,
  type SocialPost,
  type EmailAutoReply,
  type CRMCustomer,
} from "@/data/hr-marketing";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<"posts" | "emails" | "crm">(
    "posts",
  );
  const [posts, setPosts] = useState<SocialPost[]>(mockSocialPosts);
  const [autoReplies] = useState<EmailAutoReply[]>(mockEmailAutoReplies);
  const [crmCustomers, setCrmCustomers] =
    useState<CRMCustomer[]>(mockCRMCustomers);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAutoReplyModalOpen, setIsAutoReplyModalOpen] = useState(false);
  const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedItem, setSelectedItem] = useState<
    SocialPost | EmailAutoReply | CRMCustomer | null
  >(null);
  const [formData, setFormData] = useState({
    platform: "LinkedIn" as SocialPost["platform"],
    content: "",
    scheduledDate: "",
    scheduledTime: "",
  });
  const [autoReplyFormData, setAutoReplyFormData] = useState({
    trigger: "",
    subject: "",
    body: "",
    isActive: true,
  });
  const [crmFormData, setCrmFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Prospect" as CRMCustomer["status"],
  });

  const postColumns: ColumnDef<SocialPost>[] = [
    {
      key: "platform",
      label: "Plateforme",
      render: (post) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          LinkedIn: "default",
          Facebook: "secondary",
          Instagram: "outline",
          YouTube: "destructive",
          X: "secondary",
        };
        return (
          <Badge variant={variants[post.platform] ?? "outline"}>
            {post.platform}
          </Badge>
        );
      },
    },
    {
      key: "content",
      label: "Contenu",
      render: (post) => (
        <span className="text-sm line-clamp-2">{post.content}</span>
      ),
    },
    {
      key: "scheduledDate",
      label: "Date de publication",
      render: (post) => new Date(post.scheduledDate).toLocaleString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (post) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          Planifié: "outline",
          Publié: "default",
          Échec: "destructive",
        };
        return <Badge variant={variants[post.status]}>{post.status}</Badge>;
      },
    },
    {
      key: "performance",
      label: "Performance",
      render: (post) =>
        post.performance ? (
          <span className="text-sm font-semibold text-green-600">
            {post.performance.engagement}% engagement
          </span>
        ) : (
          "-"
        ),
    },
  ];

  const handleCreatePost = () => {
    setFormData({
      platform: "LinkedIn",
      content: "",
      scheduledDate: "",
      scheduledTime: "",
    });
    setIsPostModalOpen(true);
  };

  const handleSavePost = () => {
    const now = new Date().toISOString();
    const newPost: SocialPost = {
      id: (posts.length + 1).toString(),
      platform: formData.platform,
      content: formData.content,
      scheduledDate: `${formData.scheduledDate}T${formData.scheduledTime}:00`,
      status: "Planifié",
      createdAt: now,
      updatedAt: now,
    };
    setPosts([...posts, newPost]);
    setIsPostModalOpen(false);
  };

  const handleRowClick = (item: SocialPost | EmailAutoReply | CRMCustomer) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  // ── CRM clients : menu actions (voir / modifier / supprimer) ────────
  const resetCrmForm = () => {
    setEditingCustomerId(null);
    setCrmFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "Prospect",
    });
  };

  const handleEditCustomer = (customer: CRMCustomer) => {
    setEditingCustomerId(customer.id);
    setCrmFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      company: customer.company ?? "",
      status: customer.status,
    });
    setIsCRMModalOpen(true);
  };

  const handleDeleteCustomer = (customer: CRMCustomer) => {
    setCrmCustomers((prev) => prev.filter((c) => c.id !== customer.id));
  };

  const handleSaveCustomer = () => {
    if (editingCustomerId) {
      setCrmCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomerId ? { ...c, ...crmFormData } : c,
        ),
      );
    } else {
      setCrmCustomers((prev) => [
        ...prev,
        {
          ...crmFormData,
          id: `CRM-${Date.now()}`,
          lastContact: new Date().toISOString(),
        } as CRMCustomer,
      ]);
    }
    setIsCRMModalOpen(false);
    resetCrmForm();
  };

  const totalEngagement = posts
    .filter((p) => p.performance)
    .reduce((sum, p) => sum + (p.performance?.engagement || 0), 0);
  const averageEngagement =
    posts.filter((p) => p.performance).length > 0
      ? totalEngagement / posts.filter((p) => p.performance).length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing RH</h1>
        <p className="text-muted-foreground">
          Gestion des publications sociales, réponses automatiques emails, CRM
          clients
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "posts" ? "default" : "ghost"}
          onClick={() => setActiveTab("posts")}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Publications Sociales
        </Button>
        <Button
          variant={activeTab === "emails" ? "default" : "ghost"}
          onClick={() => setActiveTab("emails")}
        >
          <Mail className="h-4 w-4 mr-2" />
          Réponses Automatiques
        </Button>
        <Button
          variant={activeTab === "crm" ? "default" : "ghost"}
          onClick={() => setActiveTab("crm")}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          CRM Clients
        </Button>
      </div>

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <>
          <div className="flex justify-between items-center">
            <InfoCardContainer>
              <InfoCard
                icon={Calendar}
                title="Publications planifiées"
                value={posts.filter((p) => p.status === "Planifié").length}
                color="blue"
              />
              <InfoCard
                icon={Share2}
                title="Publications publiées"
                value={posts.filter((p) => p.status === "Publié").length}
                color="green"
              />
              <InfoCard
                icon={TrendingUp}
                title="Engagement moyen"
                value={`${averageEngagement.toFixed(1)}%`}
                color="orange"
              />
            </InfoCardContainer>
            <Button onClick={handleCreatePost}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle publication
            </Button>
          </div>

          <DataTable
            data={posts}
            columns={postColumns}
            searchKey="content"
            searchPlaceholder="Rechercher une publication..."
            onRowClick={handleRowClick}
          />
        </>
      )}

      {/* Emails Tab */}
      {activeTab === "emails" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Réponses Automatiques</h2>
            <Button onClick={() => setIsAutoReplyModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
          <div className="space-y-3">
            {autoReplies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{reply.trigger}</h3>
                      <p className="text-sm text-muted-foreground">
                        {reply.subject}
                      </p>
                    </div>
                    <Badge variant={reply.isActive ? "default" : "outline"}>
                      {reply.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CRM Tab */}
      {activeTab === "crm" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion CRM Clients</h2>
            <Button onClick={() => setIsCRMModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {crmCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <RowActionsMenu
                      onView={() => handleRowClick(customer)}
                      onEdit={() => handleEditCustomer(customer)}
                      onDelete={() => handleDeleteCustomer(customer)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {customer.email}
                  </p>
                  <Badge variant="secondary">{customer.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Dernier contact:{" "}
                    {new Date(customer.lastContact).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <Modal
        open={isPostModalOpen}
        onOpenChange={setIsPostModalOpen}
        type="form"
        title="Nouvelle publication"
        size="lg"
        actions={{
          primary: {
            label: "Planifier",
            onClick: handleSavePost,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsPostModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="platform">Plateforme</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  platform: value as SocialPost["platform"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="X">X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Votre message..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Heure</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledTime: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Auto Reply Modal */}
      <Modal
        open={isAutoReplyModalOpen}
        onOpenChange={setIsAutoReplyModalOpen}
        type="form"
        title="Nouvelle règle de réponse automatique"
        size="lg"
        actions={{
          primary: {
            label: "Créer la règle",
            onClick: () => {
              // Handle save auto reply
              alert("Règle de réponse automatique créée!");
              setIsAutoReplyModalOpen(false);
            },
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsAutoReplyModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="trigger">Déclencheur</Label>
            <Input
              id="trigger"
              value={autoReplyFormData.trigger}
              onChange={(e) =>
                setAutoReplyFormData({
                  ...autoReplyFormData,
                  trigger: e.target.value,
                })
              }
              placeholder="Ex: Candidature spontanée"
            />
          </div>

          <div>
            <Label htmlFor="subject">Objet de l&apos;email</Label>
            <Input
              id="subject"
              value={autoReplyFormData.subject}
              onChange={(e) =>
                setAutoReplyFormData({
                  ...autoReplyFormData,
                  subject: e.target.value,
                })
              }
              placeholder="Objet de la réponse automatique"
            />
          </div>

          <div>
            <Label htmlFor="body">Corps de l&apos;email</Label>
            <Textarea
              id="body"
              value={autoReplyFormData.body}
              onChange={(e) =>
                setAutoReplyFormData({
                  ...autoReplyFormData,
                  body: e.target.value,
                })
              }
              placeholder="Contenu de la réponse automatique..."
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={autoReplyFormData.isActive}
              onChange={(e) =>
                setAutoReplyFormData({
                  ...autoReplyFormData,
                  isActive: e.target.checked,
                })
              }
            />
            <Label htmlFor="isActive">Activer cette r&egrave;gle</Label>
          </div>
        </div>
      </Modal>

      {/* CRM Add Client Modal */}
      <Modal
        open={isCRMModalOpen}
        onOpenChange={(open) => {
          setIsCRMModalOpen(open);
          if (!open) resetCrmForm();
        }}
        type="form"
        title={editingCustomerId ? "Modifier le client" : "Ajouter un client"}
        size="lg"
        actions={{
          primary: {
            label: editingCustomerId
              ? "Enregistrer les modifications"
              : "Ajouter le client",
            onClick: handleSaveCustomer,
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setIsCRMModalOpen(false);
              resetCrmForm();
            },
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du client</Label>
            <Input
              id="name"
              value={crmFormData.name}
              onChange={(e) =>
                setCrmFormData({ ...crmFormData, name: e.target.value })
              }
              placeholder="Nom complet"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={crmFormData.email}
              onChange={(e) =>
                setCrmFormData({ ...crmFormData, email: e.target.value })
              }
              placeholder="email@exemple.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <PhoneInput
              id="phone"
              value={crmFormData.phone}
              onChange={(value) =>
                setCrmFormData({ ...crmFormData, phone: value })
              }
            />
          </div>

          <div>
            <Label htmlFor="company">Entreprise</Label>
            <Input
              id="company"
              value={crmFormData.company}
              onChange={(e) =>
                setCrmFormData({ ...crmFormData, company: e.target.value })
              }
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={crmFormData.status}
              onValueChange={(value) =>
                setCrmFormData({
                  ...crmFormData,
                  status: value as CRMCustomer["status"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prospect">Prospect</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Ancien client">Ancien client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
