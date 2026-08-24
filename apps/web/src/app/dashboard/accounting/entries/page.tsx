"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal, Eye, Plus } from "lucide-react";
import {
  AccountingEntry,
  mockAccountingEntries,
} from "@/data/accounting-entries";

// Summary type for display in the table
interface EntrySummary {
  entryNumber: string;
  date: string;
  journal: string;
  label: string;
  partner?: string;
  totalDebit: number;
  totalCredit: number;
  status: AccountingEntry["status"];
}

function AccountingEntriesContent() {
  const searchParams = useSearchParams();
  const journalFilter = searchParams?.get("journal") || null;

  const [entries] = useState<AccountingEntry[]>(() => {
    if (journalFilter) {
      return mockAccountingEntries.filter((e) => e.journal === journalFilter);
    }
    return mockAccountingEntries;
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [journalFilterLocal, setJournalFilterLocal] = useState<string>(
    journalFilter || "all",
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Group entries by entry number (each entry has multiple lines)
  const groupedEntries = useMemo(() => {
    const grouped: Record<string, AccountingEntry[]> = {};
    entries.forEach((entry) => {
      if (!grouped[entry.entryNumber]) {
        grouped[entry.entryNumber] = [];
      }
      grouped[entry.entryNumber].push(entry);
    });
    return grouped;
  }, [entries]);

  // Convert to summary objects for the table
  const entrySummaries = useMemo((): EntrySummary[] => {
    return Object.keys(groupedEntries).map((entryNumber) => {
      const lines = groupedEntries[entryNumber];
      const first = lines[0];
      return {
        entryNumber,
        date: first.date,
        journal: first.journal,
        label: first.label,
        partner: first.partner,
        totalDebit: lines.reduce((sum, l) => sum + l.debit, 0),
        totalCredit: lines.reduce((sum, l) => sum + l.credit, 0),
        status: first.status,
      };
    });
  }, [groupedEntries]);

  const filteredEntries = useMemo(() => {
    return entrySummaries.filter((summary) => {
      const matchesSearch =
        searchQuery === "" ||
        summary.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.partner?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || summary.status === statusFilter;

      const matchesJournal =
        journalFilterLocal === "all" || summary.journal === journalFilterLocal;

      return matchesSearch && matchesStatus && matchesJournal;
    });
  }, [entrySummaries, searchQuery, statusFilter, journalFilterLocal]);

  const getStatusBadge = (status: AccountingEntry["status"]) => {
    switch (status) {
      case "Validée":
        return <Badge variant="default">{status}</Badge>;
      case "Brouillon":
        return <Badge variant="outline">{status}</Badge>;
      case "Pointée":
        return <Badge variant="secondary">{status}</Badge>;
      case "Lettrée":
        return (
          <Badge className="bg-purple-500/20 text-purple-400">{status}</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<EntrySummary>[] = [
    {
      key: "entryNumber",
      label: "Numéro",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm">{item.entryNumber}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (item) => new Date(item.date).toLocaleDateString("fr-FR"),
    },
    {
      key: "journal",
      label: "Journal",
      render: (item) => <Badge variant="outline">{item.journal}</Badge>,
    },
    {
      key: "label",
      label: "Libellé",
      render: (item) => (
        <div>
          <div className="font-medium">{item.label}</div>
          {item.partner && (
            <div className="text-xs text-muted-foreground">{item.partner}</div>
          )}
        </div>
      ),
    },
    {
      key: "debit",
      label: "Débit",
      sortable: true,
      render: (item) =>
        item.totalDebit > 0 ? (
          <span className="text-red-400">
            {formatCurrency(item.totalDebit)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "credit",
      label: "Crédit",
      sortable: true,
      render: (item) =>
        item.totalCredit > 0 ? (
          <span className="text-green-400">
            {formatCurrency(item.totalCredit)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      label: "Statut",
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedEntry(groupedEntries[item.entryNumber][0]);
                setIsViewModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2 text-green-600" />
              Voir le détail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewDetails = (item: EntrySummary) => {
    const entry = groupedEntries[item.entryNumber]?.[0];
    if (entry) {
      setSelectedEntry(entry);
      setIsViewModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Écritures Comptables</h1>
          <p className="text-muted-foreground">
            Consultation et gestion des écritures comptables
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle écriture
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Rechercher une écriture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Brouillon">Brouillon</SelectItem>
            <SelectItem value="Validée">Validée</SelectItem>
            <SelectItem value="Pointée">Pointée</SelectItem>
            <SelectItem value="Lettrée">Lettrée</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={journalFilterLocal}
          onValueChange={setJournalFilterLocal}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Journal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les journaux</SelectItem>
            <SelectItem value="VENTE">Ventes</SelectItem>
            <SelectItem value="ACHAT">Achats</SelectItem>
            <SelectItem value="BANQUE">Banque</SelectItem>
            <SelectItem value="OD">Opérations Diverses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filteredEntries}
        columns={columns}
        searchKey="entryNumber"
        onRowClick={handleViewDetails}
      />

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détail de l'écriture"
        size="lg"
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Num&eacute;ro d&apos;&eacute;criture</Label>
                <p className="text-sm font-medium font-mono">
                  {selectedEntry.entryNumber}
                </p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedEntry.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Journal</Label>
                <p className="text-sm font-medium">{selectedEntry.journal}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedEntry.status)}
                </div>
              </div>
              <div className="col-span-2">
                <Label>Libellé</Label>
                <p className="text-sm font-medium">{selectedEntry.label}</p>
              </div>
              {selectedEntry.partner && (
                <div className="col-span-2">
                  <Label>Tiers</Label>
                  <p className="text-sm font-medium">{selectedEntry.partner}</p>
                </div>
              )}
            </div>

            {/* Lines Table */}
            <div className="mt-6">
              <Label>Lignes d&apos;&eacute;criture</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Compte</th>
                      <th className="px-3 py-2 text-left">Libellé</th>
                      <th className="px-3 py-2 text-right">Débit</th>
                      <th className="px-3 py-2 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedEntries[selectedEntry.entryNumber]?.map(
                      (line, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2 font-mono">
                            {line.account}
                          </td>
                          <td className="px-3 py-2">{line.accountLabel}</td>
                          <td className="px-3 py-2 text-right text-red-400">
                            {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right text-green-400">
                            {line.credit > 0
                              ? formatCurrency(line.credit)
                              : "-"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                  <tfoot className="bg-muted font-medium">
                    <tr>
                      <td className="px-3 py-2" colSpan={2}>
                        Total
                      </td>
                      <td className="px-3 py-2 text-right text-red-400">
                        {formatCurrency(
                          groupedEntries[selectedEntry.entryNumber]?.reduce(
                            (sum, l) => sum + l.debit,
                            0,
                          ) || 0,
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-green-400">
                        {formatCurrency(
                          groupedEntries[selectedEntry.entryNumber]?.reduce(
                            (sum, l) => sum + l.credit,
                            0,
                          ) || 0,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AccountingEntriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
      <AccountingEntriesContent />
    </Suspense>
  );
}
