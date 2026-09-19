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
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";
import {
  mockEmailAutoReplies,
  type SocialPost,
  type EmailAutoReply,
  type CRMCustomer,
} from "@/data/hr-marketing";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<"posts" | "emails" | "crm">(
    "posts",
  );
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  // Le libellé enregistré est explicite : sans lui, chaque publication
  // apparaissait sous le nom générique « Ligne » dans le registre.
  const [posts, setPosts] = useListePersistante<SocialPost>(
    "publication_sociale",
    {
      libelle: (p) => `${p.platform} - ${p.content}`.slice(0, 160),
    },
  );
  const [autoReplies] = useState<EmailAutoReply[]>(mockEmailAutoReplies);
  const [crmCustomers, setCrmCustomers] =
    useListePersistante<CRMCustomer>("client_crm");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [viewPost, setViewPost] = useState<SocialPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);
  const [viewCustomer, setViewCustomer] = useState<CRMCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<CRMCustomer | null>(
    null,
  );
  const [crmError, setCrmError] = useState<string | null>(null);
  const [isAutoReplyModalOpen, setIsAutoReplyModalOpen] = useState(false);
  const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform: "LinkedIn" as SocialPost["platform"],
    content: "",
    scheduledDate: "",
    scheduledTime: "",
    status: "Planifié" as SocialPost["status"],
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

  /** Les dates enregistrées reviennent sous forme de Date : on accepte les deux. */
  const enDate = (v: string | Date | undefined) => new Date(v ?? "");
  const dateInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const heureInput = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostError(null);
    setFormData({
      platform: "LinkedIn",
      content: "",
      scheduledDate: "",
      scheduledTime: "",
      status: "Planifié",
    });
  };

  const handleCreatePost = () => {
    resetPostForm();
    setIsPostModalOpen(true);
  };

  const handleEditPost = (post: SocialPost) => {
    const quand = enDate(post.scheduledDate);
    const valide = !Number.isNaN(quand.getTime());
    setEditingPostId(post.id);
    setPostError(null);
    setFormData({
      platform: post.platform,
      content: post.content,
      scheduledDate: valide ? dateInput(quand) : "",
      scheduledTime: valide ? heureInput(quand) : "",
      status: post.status,
    });
    setIsPostModalOpen(true);
  };

  const handleSavePost = () => {
    if (!formData.content.trim()) {
      setPostError("Le contenu de la publication est obligatoire.");
      return;
    }
    if (!formData.scheduledDate) {
      setPostError("La date de publication est obligatoire.");
      return;
    }
    const quand = new Date(
      `${formData.scheduledDate}T${formData.scheduledTime || "09:00"}:00`,
    );
    if (Number.isNaN(quand.getTime())) {
      setPostError("La date ou l'heure saisie n'est pas valide.");
      return;
    }
    const now = new Date().toISOString();
    if (editingPostId) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPostId
            ? {
                ...p,
                platform: formData.platform,
                content: formData.content.trim(),
                scheduledDate: quand.toISOString(),
                status: formData.status,
                updatedAt: now,
              }
            : p,
        ),
      );
    } else {
      // L'identifiant est attribué par le serveur à l'enregistrement : celui-ci
      // ne sert qu'à distinguer la ligne le temps de l'envoi.
      setPosts((prev) => [
        ...prev,
        {
          id: `nouvelle-${Date.now()}`,
          platform: formData.platform,
          content: formData.content.trim(),
          scheduledDate: quand.toISOString(),
          status: "Planifié",
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    setIsPostModalOpen(false);
    resetPostForm();
  };

  const handleConfirmDeletePost = () => {
    if (!postToDelete) return;
    const id = postToDelete.id;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setPostToDelete(null);
  };

  // ── CRM clients : menu actions (voir / modifier / supprimer) ────────
  const resetCrmForm = () => {
    setEditingCustomerId(null);
    setCrmError(null);
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
    setCrmError(null);
    setCrmFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      company: customer.company ?? "",
      status: customer.status,
    });
    setIsCRMModalOpen(true);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    const id = customerToDelete.id;
    setCrmCustomers((prev) => prev.filter((c) => c.id !== id));
    setCustomerToDelete(null);
  };

  const handleSaveCustomer = () => {
    if (!crmFormData.name.trim()) {
      setCrmError("Le nom du client est obligatoire.");
      return;
    }
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
          id: `nouveau-${Date.now()}`,
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
            onRowClick={(post) => setViewPost(post)}
            actions={(post) => (
              <RowActionsMenu
                onView={() => setViewPost(post)}
                onEdit={() => handleEditPost(post)}
                onDelete={() => setPostToDelete(post)}
              />
            )}
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
          {crmCustomers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun client dans le CRM pour le moment.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {crmCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <RowActionsMenu
                      onView={() => setViewCustomer(customer)}
                      onEdit={() => handleEditCustomer(customer)}
                      onDelete={() => setCustomerToDelete(customer)}
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
        onOpenChange={(open) => {
          setIsPostModalOpen(open);
          if (!open) resetPostForm();
        }}
        type="form"
        title={
          editingPostId ? "Modifier la publication" : "Nouvelle publication"
        }
        size="lg"
        actions={{
          primary: {
            label: editingPostId
              ? "Enregistrer les modifications"
              : "Planifier",
            onClick: handleSavePost,
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setIsPostModalOpen(false);
              resetPostForm();
            },
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          {postError && (
            <p className="text-sm text-destructive" role="alert">
              {postError}
            </p>
          )}
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

          {editingPostId && (
            <div>
              <Label htmlFor="postStatus">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as SocialPost["status"],
                  })
                }
              >
                <SelectTrigger id="postStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planifié">Planifié</SelectItem>
                  <SelectItem value="Publié">Publié</SelectItem>
                  <SelectItem value="Échec">Échec</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Modal>

      {/* View Post Modal */}
      <Modal
        open={viewPost !== null}
        onOpenChange={(open) => {
          if (!open) setViewPost(null);
        }}
        type="details"
        title="Détails de la publication"
        size="lg"
        actions={{
          primary: {
            label: "Modifier",
            onClick: () => {
              const post = viewPost;
              setViewPost(null);
              if (post) handleEditPost(post);
            },
          },
          secondary: {
            label: "Fermer",
            onClick: () => setViewPost(null),
            variant: "outline",
          },
        }}
      >
        {viewPost && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plateforme</Label>
                <p className="text-sm font-medium">{viewPost.platform}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <div>
                  <Badge variant="outline">{viewPost.status}</Badge>
                </div>
              </div>
            </div>
            <div>
              <Label>Contenu</Label>
              <p className="text-sm whitespace-pre-wrap">{viewPost.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de publication</Label>
                <p className="text-sm font-medium">
                  {enDate(viewPost.scheduledDate).toLocaleString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Créée le</Label>
                <p className="text-sm font-medium">
                  {enDate(viewPost.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            {viewPost.performance && (
              <div>
                <Label>Performance</Label>
                <p className="text-sm">
                  {viewPost.performance.views} vues,{" "}
                  {viewPost.performance.likes} mentions j&apos;aime,{" "}
                  {viewPost.performance.shares} partages,{" "}
                  {viewPost.performance.comments} commentaires (
                  {viewPost.performance.engagement}% d&apos;engagement)
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Post Modal */}
      <Modal
        open={postToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPostToDelete(null);
        }}
        type="warning"
        title="Supprimer la publication"
        description="Cette action est irréversible."
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleConfirmDeletePost,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setPostToDelete(null),
            variant: "outline",
          },
        }}
        closable={false}
      >
        <p className="text-sm text-muted-foreground line-clamp-3">
          {postToDelete
            ? `Supprimer la publication ${postToDelete.platform} : « ${postToDelete.content} » ?`
            : ""}
        </p>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        open={viewCustomer !== null}
        onOpenChange={(open) => {
          if (!open) setViewCustomer(null);
        }}
        type="details"
        title="Détails du client"
        size="lg"
        actions={{
          primary: {
            label: "Modifier",
            onClick: () => {
              const customer = viewCustomer;
              setViewCustomer(null);
              if (customer) handleEditCustomer(customer);
            },
          },
          secondary: {
            label: "Fermer",
            onClick: () => setViewCustomer(null),
            variant: "outline",
          },
        }}
      >
        {viewCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <p className="text-sm font-medium">{viewCustomer.name}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <div>
                  <Badge variant="secondary">{viewCustomer.status}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">
                  {viewCustomer.email || "Non renseigné"}
                </p>
              </div>
              <div>
                <Label>Téléphone</Label>
                <p className="text-sm font-medium">
                  {viewCustomer.phone || "Non renseigné"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entreprise</Label>
                <p className="text-sm font-medium">
                  {viewCustomer.company || "Non renseigné"}
                </p>
              </div>
              <div>
                <Label>Dernier contact</Label>
                <p className="text-sm font-medium">
                  {enDate(viewCustomer.lastContact).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Customer Modal */}
      <Modal
        open={customerToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCustomerToDelete(null);
        }}
        type="warning"
        title="Supprimer le client"
        description="Cette action est irréversible."
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleConfirmDeleteCustomer,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setCustomerToDelete(null),
            variant: "outline",
          },
        }}
        closable={false}
      >
        <p className="text-sm text-muted-foreground">
          {customerToDelete
            ? `Supprimer « ${customerToDelete.name} » du CRM ?`
            : ""}
        </p>
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
          {crmError && (
            <p className="text-sm text-destructive" role="alert">
              {crmError}
            </p>
          )}
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
