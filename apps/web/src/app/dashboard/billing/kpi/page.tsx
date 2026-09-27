"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import {
  Download,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { mockBillingInvoices } from "@/data/billing-invoices";
import { mockBillingClients } from "@/data/billing-clients";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

export default function BillingKPIPage() {
  const invoices = mockBillingInvoices;
  const clients = mockBillingClients;

  // Calculate KPIs
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Monthly sales data (Jan - Dec)
  const monthlySales = [
    { month: "Janvier", shortMonth: "Jan", revenue: 0, invoices: 0 },
    { month: "Février", shortMonth: "Fév", revenue: 0, invoices: 0 },
    { month: "Mars", shortMonth: "Mar", revenue: 0, invoices: 0 },
    { month: "Avril", shortMonth: "Avr", revenue: 0, invoices: 0 },
    { month: "Mai", shortMonth: "Mai", revenue: 0, invoices: 0 },
    { month: "Juin", shortMonth: "Juin", revenue: 0, invoices: 0 },
    { month: "Juillet", shortMonth: "Juil", revenue: 0, invoices: 0 },
    { month: "Août", shortMonth: "Août", revenue: 0, invoices: 0 },
    { month: "Septembre", shortMonth: "Sept", revenue: 0, invoices: 0 },
    { month: "Octobre", shortMonth: "Oct", revenue: 0, invoices: 0 },
    { month: "Novembre", shortMonth: "Nov", revenue: 0, invoices: 0 },
    { month: "Décembre", shortMonth: "Déc", revenue: 0, invoices: 0 },
  ];

  // Populate monthly sales from invoices
  invoices.forEach((inv) => {
    const date = new Date(inv.createdAt);
    const monthIndex = date.getMonth();
    monthlySales[monthIndex].revenue += inv.total;
    monthlySales[monthIndex].invoices += 1;
  });

  // Calculate invoice status based on payment terms
  const today = new Date();
  const invoicesByStatus = {
    paid: 0,
    onTime: 0,
    late30: 0, // En retard -30 jours
    late30Plus: 0, // En retard +30 jours
  };

  invoices.forEach((inv) => {
    if (inv.status === "Payée") {
      invoicesByStatus.paid += 1;
    } else if (inv.status === "Envoyée") {
      const client = clients.find((c) => c.id === inv.clientId);
      const paymentTerm = client?.paymentTerm || 30;

      const sentDate = inv.sentAt
        ? new Date(inv.sentAt)
        : new Date(inv.createdAt);
      const dueDate = new Date(sentDate);
      dueDate.setDate(dueDate.getDate() + paymentTerm);

      const daysLate = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysLate <= 0) {
        invoicesByStatus.onTime += 1;
      } else if (daysLate <= 30) {
        invoicesByStatus.late30 += 1;
      } else {
        invoicesByStatus.late30Plus += 1;
      }
    }
  });

  const invoiceStatusData = [
    {
      name: "Payées",
      value: invoicesByStatus.paid,
      color: "#22c55e",
    },
    {
      name: "À temps",
      value: invoicesByStatus.onTime,
      color: "#3b82f6",
    },
    {
      name: "Retard -30j",
      value: invoicesByStatus.late30,
      color: "#f97316",
    },
    {
      name: "Retard +30j",
      value: invoicesByStatus.late30Plus,
      color: "#ef4444",
    },
  ];
  const revenueByClient = invoices.reduce(
    (acc, inv) => {
      acc[inv.clientId] = (acc[inv.clientId] || 0) + inv.total;
      return acc;
    },
    {} as Record<string, number>,
  );

  const revenueBySite = invoices.reduce(
    (acc, inv) => {
      if (inv.siteId) {
        acc[inv.siteId] = (acc[inv.siteId] || 0) + inv.total;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalHoursBilled = invoices.reduce(
    (sum, inv) =>
      sum + (inv.validatedHours || inv.realizedHours || inv.planningHours || 0),
    0,
  );
  const totalHoursRealized = invoices.reduce(
    (sum, inv) => sum + (inv.realizedHours || inv.planningHours || 0),
    0,
  );

  const varianceRate =
    totalHoursRealized > 0
      ? ((totalHoursBilled - totalHoursRealized) / totalHoursRealized) * 100
      : 0;

  const handleExport = () => {
    alert("Export Excel/PDF en cours...");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard & KPI Facturation</h1>
          <p className="text-muted-foreground">
            Indicateurs clés de performance, analyses et graphiques dynamiques
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter (Excel/PDF)
        </Button>
      </div>

      {/* KPI Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={DollarSign}
          title="Chiffre d'affaires Total"
          value={`${totalRevenue.toLocaleString("fr-FR")} €`}
          subtext="TTC"
          color="green"
        />

        <InfoCard
          icon={Clock}
          title="Heures Facturées"
          value={`${totalHoursBilled} h`}
          subtext={`vs ${totalHoursRealized} h réalisées`}
          color="blue"
        />

        <InfoCard
          icon={TrendingUp}
          title="Taux d'écart"
          value={`${varianceRate >= 0 ? "+" : ""}${varianceRate.toFixed(1)}%`}
          subtext="Planning / Facturation"
          color="purple"
        />

        <InfoCard
          icon={FileText}
          title="Factures Envoyées"
          value={
            invoices.filter(
              (inv) => inv.status === "Envoyée" || inv.status === "Payée",
            ).length
          }
          subtext={`sur ${invoices.length}`}
          color="orange"
        />
      </InfoCardContainer>

      {/* Payment Status Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={CheckCircle}
          title="Payées"
          value={invoicesByStatus.paid}
          subtext="Factures réglées"
          color="green"
        />

        <InfoCard
          icon={Clock}
          title="À temps"
          value={invoicesByStatus.onTime}
          subtext="Délai de paiement respecté"
          color="blue"
        />

        <InfoCard
          icon={AlertCircle}
          title="Retard -30 jours"
          value={invoicesByStatus.late30}
          subtext="En retard moins de 30j"
          color="orange"
        />

        <InfoCard
          icon={AlertCircle}
          title="Retard +30 jours"
          value={invoicesByStatus.late30Plus}
          subtext="En retard plus de 30j"
          color="red"
        />
      </InfoCardContainer>

      {/* Monthly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ventes mensuelles (Janvier - Décembre)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shortMonth" />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `${(value || 0).toLocaleString("fr-FR")} €`
                }
                labelFormatter={(label) => {
                  const monthData = monthlySales.find(
                    (m) => m.shortMonth === label,
                  );
                  return monthData?.month || label;
                }}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Chiffre d'affaires (€)"
                fill="#3b82f6"
              />
              <Bar
                dataKey="invoices"
                name="Nombre de factures"
                fill="#10b981"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Invoice Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des factures</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortMonth" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    `${(value || 0).toLocaleString("fr-FR")} €`
                  }
                  labelFormatter={(label) => {
                    const monthData = monthlySales.find(
                      (m) => m.shortMonth === label,
                    );
                    return monthData?.month || label;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Chiffre d'affaires"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Late Invoices Details */}
      {(invoicesByStatus.late30 > 0 || invoicesByStatus.late30Plus > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Factures en retard - Détails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices
                .filter((inv) => {
                  if (inv.status !== "Envoyée") return false;
                  const client = clients.find((c) => c.id === inv.clientId);
                  const paymentTerm = client?.paymentTerm || 30;
                  const sentDate = inv.sentAt
                    ? new Date(inv.sentAt)
                    : new Date(inv.createdAt);
                  const dueDate = new Date(sentDate);
                  dueDate.setDate(dueDate.getDate() + paymentTerm);
                  const daysLate = Math.floor(
                    (today.getTime() - dueDate.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return daysLate > 0;
                })
                .sort((a, b) => {
                  const aDate = a.sentAt
                    ? new Date(a.sentAt)
                    : new Date(a.createdAt);
                  const bDate = b.sentAt
                    ? new Date(b.sentAt)
                    : new Date(b.createdAt);
                  return aDate.getTime() - bDate.getTime();
                })
                .map((inv) => {
                  const client = clients.find((c) => c.id === inv.clientId);
                  const paymentTerm = client?.paymentTerm || 30;
                  const sentDate = inv.sentAt
                    ? new Date(inv.sentAt)
                    : new Date(inv.createdAt);
                  const dueDate = new Date(sentDate);
                  dueDate.setDate(dueDate.getDate() + paymentTerm);
                  const daysLate = Math.floor(
                    (today.getTime() - dueDate.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );

                  return (
                    <div
                      key={inv.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        daysLate > 30
                          ? "bg-red-50 dark:bg-red-950 border-red-200"
                          : "bg-orange-50 dark:bg-orange-950 border-orange-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              daysLate > 30
                                ? "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100"
                                : "bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-100"
                            }`}
                          >
                            +{daysLate} jours
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {inv.clientName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {inv.total.toLocaleString("fr-FR")} €
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Échéance: {dueDate.toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Service Type and Client - Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Service Type - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires par Prestation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(
                    clients.reduce(
                      (acc, client) => {
                        const clientInvoices = invoices.filter(
                          (inv) => inv.clientId === client.id,
                        );
                        const clientRevenue = clientInvoices.reduce(
                          (sum, inv) => sum + inv.total,
                          0,
                        );
                        if (clientRevenue > 0) {
                          const types =
                            client.serviceTypes &&
                            client.serviceTypes.length > 0
                              ? client.serviceTypes
                              : client.serviceType
                                ? [client.serviceType]
                                : [];
                          types.forEach((t) => {
                            acc[t] = (acc[t] || 0) + clientRevenue;
                          });
                        }
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([serviceType, revenue], index) => ({
                    name: serviceType,
                    value: revenue,
                    color: [
                      "#3b82f6",
                      "#10b981",
                      "#f59e0b",
                      "#8b5cf6",
                      "#ef4444",
                      "#295F8E",
                      "#ec4899",
                    ][index % 7],
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${value.toLocaleString("fr-FR")}€`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(
                    clients.reduce(
                      (acc, client) => {
                        const clientInvoices = invoices.filter(
                          (inv) => inv.clientId === client.id,
                        );
                        const clientRevenue = clientInvoices.reduce(
                          (sum, inv) => sum + inv.total,
                          0,
                        );
                        if (clientRevenue > 0) {
                          const types =
                            client.serviceTypes &&
                            client.serviceTypes.length > 0
                              ? client.serviceTypes
                              : client.serviceType
                                ? [client.serviceType]
                                : [];
                          types.forEach((t) => {
                            acc[t] = (acc[t] || 0) + clientRevenue;
                          });
                        }
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([,], index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        [
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#8b5cf6",
                          "#ef4444",
                          "#295F8E",
                          "#ec4899",
                        ][index % 7]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `${(value || 0).toLocaleString("fr-FR")} €`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Client - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(revenueByClient)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([clientId, revenue]) => {
                    const client = clients.find((c) => c.id === clientId);
                    return {
                      name: client?.name || clientId,
                      revenue,
                    };
                  })}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip
                  formatter={(value) =>
                    `${(value || 0).toLocaleString("fr-FR")} €`
                  }
                />
                <Bar dataKey="revenue" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Client - Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>Chiffre d&apos;affaires par Client (détaillé)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(revenueByClient)
              .sort((a, b) => b[1] - a[1])
              .map(([clientId, revenue]) => {
                const client = clients.find((c) => c.id === clientId);
                return (
                  <div
                    key={clientId}
                    className="flex justify-between items-center p-2 hover:bg-muted/50 rounded"
                  >
                    <span className="text-sm">{client?.name || clientId}</span>
                    <span className="text-sm font-semibold">
                      {revenue.toLocaleString("fr-FR")} €
                    </span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Site */}
      {Object.keys(revenueBySite).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires par Site</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(revenueBySite).map(([siteId, revenue]) => {
                const invoice = invoices.find((inv) => inv.siteId === siteId);
                return (
                  <div
                    key={siteId}
                    className="flex justify-between items-center p-2 hover:bg-muted/50 rounded"
                  >
                    <span className="text-sm">
                      {invoice?.siteName || siteId}
                    </span>
                    <span className="text-sm font-semibold">
                      {revenue.toLocaleString("fr-FR")} €
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
