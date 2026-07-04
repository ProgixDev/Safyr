"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  RefreshCw,
  Copy,
  ExternalLink,
  LogIn,
  Users,
  Building2,
  Briefcase,
  Calendar,
  ClipboardList,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DevEmail = {
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  meta?: Record<string, unknown>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";


const SEEDED_ACCOUNTS: {
  email: string;
  name: string;
  role: "Owner" | "Agent";
}[] = [
  {
    email: "prodigesecurite@gmail.com",
    name: "Chaffa Belarbi",
    role: "Owner",
  },
  {
    email: "khalil3cheddadi@gmail.com",
    name: "Khalil Cheddadi",
    role: "Owner",
  },
  {
    email: "marie.dupont@prodige-securite.fr",
    name: "Marie Dupont",
    role: "Agent",
  },
  {
    email: "thomas.martin@prodige-securite.fr",
    name: "Thomas Martin",
    role: "Agent",
  },
  {
    email: "sophie.leroy@prodige-securite.fr",
    name: "Sophie Leroy",
    role: "Agent",
  },
];

const MODULE_LINKS: {
  group: string;
  items: { label: string; href: string; icon: typeof Users }[];
}[] = [
  {
    group: "RH",
    items: [
      {
        label: "Entreprise (mon org)",
        href: "/dashboard/hr/entreprise",
        icon: Building2,
      },
      {
        label: "Sites & Postes",
        href: "/dashboard/hr/sites",
        icon: Briefcase,
      },
      {
        label: "Personnel (employés)",
        href: "/dashboard/hr/collaborators",
        icon: Users,
      },
    ],
  },
  {
    group: "Planning & Pointage",
    items: [
      {
        label: "Planning vacations",
        href: "/dashboard/planning/vacations",
        icon: Calendar,
      },
      {
        label: "Pointage GPS",
        href: "/dashboard/geolocation/pointage",
        icon: Clock,
      },
      {
        label: "Live tracking (réel)",
        href: "/dashboard/geolocation/live-api",
        icon: MapPin,
      },
    ],
  },
  {
    group: "Main courante",
    items: [
      {
        label: "Événements + validation",
        href: "/dashboard/logbook/events-api",
        icon: ClipboardList,
      },
    ],
  },
];

function isLinkInMeta(meta: unknown): meta is { url: string } {
  return (
    typeof meta === "object" &&
    meta !== null &&
    typeof (meta as { url?: unknown }).url === "string"
  );
}

function isOtpInMeta(meta: unknown): meta is { otp: string } {
  return (
    typeof meta === "object" &&
    meta !== null &&
    typeof (meta as { otp?: unknown }).otp === "string"
  );
}

export default function DevInboxPage() {
  const router = useRouter();
  const [emailFilter, setEmailFilter] = useState("");
  const [items, setItems] = useState<DevEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginAs, setLoginAs] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  async function quickLogin(email: string) {
    setLoginAs(email);
    try {
      // 1. Demande un OTP via better-auth
      const sendRes = await fetch(
        `${API_BASE}/api/auth/email-otp/send-verification-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, type: "sign-in" }),
        },
      );
      if (!sendRes.ok) {
        const txt = await sendRes.text();
        alert(`Envoi OTP échoué : ${txt.slice(0, 200)}`);
        return;
      }

      // 2. Petite pause pour laisser le serveur stocker l'OTP dans la dev inbox
      await new Promise((r) => setTimeout(r, 200));

      // 3. Récupère le code depuis la dev inbox
      const inboxRes = await fetch(
        `${API_BASE}/api/dev/inbox/last/${encodeURIComponent(email)}`,
        { credentials: "include" },
      );
      if (!inboxRes.ok) {
        alert("Impossible de récupérer le code OTP depuis la dev inbox");
        return;
      }
      const inboxJson = await inboxRes.json();
      const otp = (inboxJson.data ?? inboxJson)?.otp;
      if (!otp) {
        alert("Aucun OTP trouvé dans la dev inbox");
        return;
      }

      // 4. Vérifie l'OTP → cookie posé par better-auth
      const verifyRes = await fetch(
        `${API_BASE}/api/auth/sign-in/email-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        },
      );
      if (!verifyRes.ok) {
        const txt = await verifyRes.text();
        alert(`Verify OTP échoué : ${txt.slice(0, 200)}`);
        return;
      }

      setCurrentUser(email);
      router.push("/dashboard");
    } catch (e) {
      alert(
        `Connexion échouée : ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoginAs(null);
    }
  }

  // Check current session
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/get-session`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.email) setCurrentUser(data.user.email);
      })
      .catch(() => {});
  }, []);

  // Healthcheck of all module endpoints
  const [moduleStatus, setModuleStatus] = useState<
    Record<string, { ok: boolean; code: number; count?: number }>
  >({});
  const checkModules = useCallback(async () => {
    const endpoints: { key: string; path: string }[] = [
      { key: "Session", path: "/api/auth/get-session" },
      { key: "Mon entreprise", path: "/api/organization" },
      { key: "Conformité entreprise", path: "/api/organization/compliance" },
      { key: "Employés", path: "/api/organization/employees" },
      { key: "Stats employés", path: "/api/organization/employees/stats" },
      { key: "Sites", path: "/api/sites" },
      { key: "Shifts (vacations)", path: "/api/shifts" },
      { key: "Pointages", path: "/api/time-entries" },
      { key: "Vacation active", path: "/api/time-entries/active" },
      { key: "Positions live", path: "/api/time-entries/active-positions" },
      { key: "Événements (main courante)", path: "/api/logbook/events" },
    ];
    const result: typeof moduleStatus = {};
    await Promise.all(
      endpoints.map(async (e) => {
        try {
          const res = await fetch(`${API_BASE}${e.path}`, {
            credentials: "include",
          });
          let count: number | undefined;
          if (res.ok) {
            try {
              const json = await res.json();
              const data = json.data ?? json;
              if (Array.isArray(data)) count = data.length;
              else if (data && typeof data === "object" && "user" in data)
                count = 1;
            } catch {
              // ignore
            }
          }
          result[e.key] = { ok: res.ok, code: res.status, count };
        } catch {
          result[e.key] = { ok: false, code: 0 };
        }
      }),
    );
    setModuleStatus(result);
  }, []);

  useEffect(() => {
    void checkModules();
    const id = setInterval(() => void checkModules(), 5000);
    return () => clearInterval(id);
  }, [checkModules]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/dev/inbox`);
      if (emailFilter.trim()) url.searchParams.set("email", emailFilter.trim());
      url.searchParams.set("limit", "10");

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          setError(
            "Endpoint dev introuvable — vérifie que le serveur tourne en NODE_ENV=development.",
          );
        } else {
          setError(`Erreur HTTP ${res.status}`);
        }
        setItems([]);
        return;
      }
      const json = await res.json();
      setItems(json.data ?? json);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de joindre le serveur dev.",
      );
    } finally {
      setLoading(false);
    }
  }, [emailFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(id);
  }, [load]);

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-7 w-7" />
            Console dev — Connexion &amp; e-mails
          </h1>
          <p className="text-muted-foreground">
            En mode développement, aucun e-mail réel n&apos;est envoyé. Utilise
            les boutons ci-dessous pour te connecter en 1 clic ou récupérer un
            code OTP / lien magique.
          </p>
          {currentUser && (
            <p className="text-xs mt-2">
              <Badge variant="default">Connecté en tant que {currentUser}</Badge>
            </p>
          )}
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogIn className="h-5 w-5" />
              Connexion 1-clic (comptes seedés)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pose un cookie de session valide pour le compte choisi. Aucun OTP
              à saisir. Disponible uniquement en NODE_ENV=development.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {SEEDED_ACCOUNTS.map((acc) => (
              <Button
                key={acc.email}
                variant={
                  currentUser === acc.email ? "default" : "outline"
                }
                onClick={() => quickLogin(acc.email)}
                disabled={loginAs === acc.email}
                className="justify-start h-auto py-3"
              >
                {loginAs === acc.email ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                <div className="text-left flex-1">
                  <div className="font-medium">{acc.name}</div>
                  <div className="text-xs opacity-70">
                    {acc.email} · {acc.role}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>État des modules (live)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void checkModules()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Recharger
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Test direct des endpoints API avec le cookie de session actuel.
              Si tu vois ❌ partout, tu n&apos;es pas connecté — utilise un
              bouton de connexion ci-dessus.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(moduleStatus).map(([key, val]) => (
              <div
                key={key}
                className={`flex items-center justify-between rounded border px-3 py-2 ${
                  val.ok
                    ? "border-green-500/30 bg-green-500/5"
                    : val.code === 401
                      ? "border-orange-500/30 bg-orange-500/5"
                      : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>
                    {val.ok ? "✅" : val.code === 401 ? "🔒" : "❌"}
                  </span>
                  <span className="font-medium">{key}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {val.ok && val.count !== undefined
                    ? `${val.count} item(s)`
                    : `HTTP ${val.code}`}
                </span>
              </div>
            ))}
            {Object.keys(moduleStatus).length === 0 && (
              <p className="col-span-2 text-xs text-muted-foreground italic">
                Test en cours…
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Accès direct aux modules
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Connecte-toi d&apos;abord avec un compte Owner via le bloc
              ci-dessus, puis clique sur un module.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {MODULE_LINKS.map((group) => (
              <div key={group.group}>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  {group.group}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((it) => {
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {it.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Boîte de réception (OTP / magic links)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Filtrer par e-mail (vide = tout afficher)"
            />
            <Button onClick={load} disabled={loading} variant="outline">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Rafraîchir</span>
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {items.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Aucun e-mail. Demande un OTP ou un magic link puis reviens.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {items.map((mail, idx) => {
            const otp = isOtpInMeta(mail.meta) ? mail.meta.otp : null;
            const link = isLinkInMeta(mail.meta) ? mail.meta.url : null;
            return (
              <Card key={`${mail.sentAt}-${idx}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">{mail.subject}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        À <span className="font-medium">{mail.to}</span> · le{" "}
                        {new Date(mail.sentAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    {otp && (
                      <Badge variant="default" className="text-base px-3 py-1">
                        OTP : <span className="font-mono ml-1">{otp}</span>
                      </Badge>
                    )}
                    {link && !otp && (
                      <Badge variant="secondary">Magic link</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {otp && (
                    <Button
                      onClick={() => copy(otp)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier le code
                    </Button>
                  )}
                  {link && (
                    <>
                      <Button asChild variant="default" size="sm">
                        <a href={link} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ouvrir le lien
                        </a>
                      </Button>
                      <Button
                        onClick={() => copy(link)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier l&apos;URL
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => copy(mail.html)}
                    variant="ghost"
                    size="sm"
                  >
                    HTML brut
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Rafraîchissement automatique toutes les 3 secondes
        </p>
      </div>
    </div>
  );
}
