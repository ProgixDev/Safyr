"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Modal } from "@/components/ui/modal";
import {
  Building2,
  CreditCard,
  Wallet,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BankAccount, mockBankAccounts } from "@/data/banking-accounts";

export default function AccountingBankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(mockBankAccounts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<BankAccount>>({});

  const totalTreasury = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeAccounts = accounts.filter(
    (acc) => acc.status === "Actif",
  ).length;
  const connectedAccounts = accounts.filter((acc) => acc.apiConnected).length;

  const getLatestSync = () => {
    if (accounts.length === 0) return "N/A";
    const latest = accounts.reduce(
      (latestDate: string, acc) =>
        new Date(acc.lastSync) > new Date(latestDate)
          ? acc.lastSync
          : latestDate,
      accounts[0].lastSync,
    );
    return new Date(latest).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const columns: ColumnDef<BankAccount>[] = [
    {
      key: "bankName",
      label: "Banque",
      sortable: true,
      render: (account) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{account.bankName}</span>
        </div>
      ),
    },
    {
      key: "accountNumber",
      label: "Numéro de compte",
      sortable: true,
    },
    {
      key: "accountType",
      label: "Type",
      render: (account) => (
        <Badge variant="outline">{account.accountType}</Badge>
      ),
    },
    {
      key: "balance",
      label: "Solde",
      sortable: true,
      render: (account) => (
        <span
          className={account.balance >= 0 ? "text-green-500" : "text-red-500"}
        >
          {formatCurrency(account.balance)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (account) => (
        <Badge
          variant={
            account.status === "Actif"
              ? "default"
              : account.status === "Suspendu"
                ? "destructive"
                : "secondary"
          }
        >
          {account.status}
        </Badge>
      ),
    },
    {
      key: "apiConnected",
      label: "Connexion",
      render: (account) =>
        account.apiConnected ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-orange-500" />
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (account) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(account)}>
              <Eye className="h-4 w-4 mr-2 text-green-600" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditFromDropdown(account)}>
              <Pencil className="h-4 w-4 mr-2 text-orange-500" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteClick(account)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleSave = () => {
    if (formData.id) {
      // Edit
      setAccounts(
        accounts.map((acc) =>
          acc.id === formData.id ? { ...acc, ...formData } : acc,
        ),
      );
    } else {
      // Create
      const newAccount: BankAccount = {
        id: (accounts.length + 1).toString(),
        bankName: formData.bankName || "",
        accountNumber: formData.accountNumber || "",
        iban: formData.iban || "",
        bic: formData.bic || "",
        accountType: formData.accountType || "Compte courant",
        balance: formData.balance || 0,
        currency: "EUR",
        status: formData.status || "Actif",
        lastSync: new Date().toISOString(),
        apiConnected: false,
      };
      setAccounts([...accounts, newAccount]);
    }
    setIsCreateModalOpen(false);
    setFormData({});
  };

  const handleView = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
  };

  const handleRowClick = (account: BankAccount) => {
    handleView(account);
  };

  const handleEditFromDropdown = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData(account);
    setIsCreateModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedAccount) {
      setFormData(selectedAccount);
      setIsViewModalOpen(false);
      setIsCreateModalOpen(true);
    }
  };

  const handleDeleteClick = (account: BankAccount) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      setAccounts(accounts.filter((acc) => acc.id !== accountToDelete.id));
      setAccountToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Comptes Bancaires</h1>
          <p className="text-muted-foreground">
            Consultation et gestion des comptes bancaires de l&apos;entreprise
          </p>
        </div>
        <Button
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
          onClick={() => {
            setFormData({});
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un compte
        </Button>
      </div>

      <InfoCardContainer className="lg:grid-cols-3">
        <InfoCard
          icon={Wallet}
          title="Trésorerie Totale"
          value={formatCurrency(totalTreasury)}
          subtext="Solde cumulé de tous les comptes"
          color="slate"
        />
        <InfoCard
          icon={CreditCard}
          title="Comptes Actifs"
          value={activeAccounts}
          subtext={`${accounts.length} comptes enregistrés`}
          color="green"
        />
        <InfoCard
          icon={RefreshCw}
          title="Dernière Synchro"
          value={getLatestSync()}
          subtext={`${connectedAccounts}/${accounts.length} connectés`}
          color="blue"
        />
      </InfoCardContainer>

      <DataTable
        data={accounts}
        columns={columns}
        searchKey="bankName"
        searchPlaceholder="Rechercher une banque..."
        onRowClick={handleRowClick}
      />

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={formData.id ? "Modifier le compte" : "Nouveau compte bancaire"}
        size="lg"
        actions={{
          primary: {
            label: formData.id ? "Enregistrer" : "Créer",
            onClick: handleSave,
            className: formData.id
              ? "bg-cyan-500 hover:bg-cyan-600 text-white"
              : undefined,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Nom de la banque</Label>
              <Input
                id="bankName"
                value={formData.bankName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="BNP Paribas"
              />
            </div>

            <div>
              <Label htmlFor="accountType">Type de compte</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    accountType: value as BankAccount["accountType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compte courant">Compte courant</SelectItem>
                  <SelectItem value="Compte de dépôt">
                    Compte de dépôt
                  </SelectItem>
                  <SelectItem value="Compte de caution">
                    Compte de caution
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accountNumber">Numéro de compte</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="30004 00001 00000123456 25"
              />
            </div>

            <div>
              <Label htmlFor="balance">Solde initial</Label>
              <Input
                id="balance"
                type="number"
                value={formData.balance || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban || ""}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                placeholder="FR76 3000 4000 0100 0001 2345 625"
              />
            </div>

            <div>
              <Label htmlFor="bic">BIC</Label>
              <Input
                id="bic"
                value={formData.bic || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bic: e.target.value })
                }
                placeholder="BNPAFRPPXXX"
              />
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as BankAccount["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                  <SelectItem value="Suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du compte bancaire"
        size="lg"
        actions={{
          primary: {
            label: "Modifier",
            onClick: handleEdit,
          },
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedAccount && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banque</Label>
                <p className="text-sm font-medium">
                  {selectedAccount.bankName}
                </p>
              </div>

              <div>
                <Label>Type de compte</Label>
                <p className="text-sm font-medium">
                  {selectedAccount.accountType}
                </p>
              </div>

              <div>
                <Label>Numéro de compte</Label>
                <p className="text-sm font-medium">
                  {selectedAccount.accountNumber}
                </p>
              </div>

              <div>
                <Label>IBAN</Label>
                <p className="text-sm font-medium font-mono">
                  {selectedAccount.iban}
                </p>
              </div>

              <div>
                <Label>BIC</Label>
                <p className="text-sm font-medium font-mono">
                  {selectedAccount.bic}
                </p>
              </div>

              <div>
                <Label>Solde</Label>
                <p
                  className={`text-sm font-medium ${
                    selectedAccount.balance >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formatCurrency(selectedAccount.balance)}
                </p>
              </div>

              <div>
                <Label>Statut</Label>
                <Badge
                  variant={
                    selectedAccount.status === "Actif"
                      ? "default"
                      : selectedAccount.status === "Suspendu"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {selectedAccount.status}
                </Badge>
              </div>

              <div>
                <Label>Connexion API</Label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedAccount.apiConnected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">Connectée</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-500">
                        Non connectée
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <Label>Dernière synchronisation</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedAccount.lastSync).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="warning"
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer le compte bancaire de ${accountToDelete?.bankName} ? Cette action est irréversible.`}
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDeleteConfirm,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteDialogOpen(false),
            variant: "outline",
          },
        }}
        closable={false}
      >
        <div className="text-sm text-muted-foreground">
          Cette action supprimera définitivement toutes les données associées à
          ce compte bancaire.
        </div>
      </Modal>
    </div>
  );
}
