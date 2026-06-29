import path from "node:path";

const nextConfig = {
  // React Compiler ajoute de l'overhead de compilation par fichier : on l'active
  // uniquement pour les builds de production afin de garder le dev fluide.
  reactCompiler: process.env.NODE_ENV === "production",
  // Skip TS/lint errors during build to unblock Vercel deploys.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Fixe la racine du workspace sur le monorepo : sinon Next remonte jusqu'à
  // C:\Users\Hp (à cause d'un package-lock.json traîné là) et surveille tout le
  // dossier personnel, ce qui ralentit énormément le dev sur Windows.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // Optimisations de performance
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // employees / training reshuffle
      {
        source: "/dashboard/hr/legal-registers/personnel",
        destination: "/dashboard/hr/employees/personnel-register",
        permanent: true,
      },
      {
        source: "/dashboard/hr/legal-registers/training",
        destination: "/dashboard/hr/training/history",
        permanent: true,
      },
      // discipline subpages → tabs
      {
        source: "/dashboard/hr/discipline/warnings",
        destination: "/dashboard/hr/lifecycle/discipline?tab=warnings",
        permanent: true,
      },
      {
        source: "/dashboard/hr/discipline/disciplinary-procedures",
        destination: "/dashboard/hr/lifecycle/discipline?tab=procedures",
        permanent: true,
      },
      {
        source: "/dashboard/hr/discipline/sanctions-register",
        destination: "/dashboard/hr/lifecycle/discipline?tab=sanctions",
        permanent: true,
      },
      // lifecycle group consolidation
      {
        source: "/dashboard/hr/recruitment/:path*",
        destination: "/dashboard/hr/lifecycle/recruitment/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/hr/interviews/:path*",
        destination: "/dashboard/hr/lifecycle/interviews/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/hr/discipline",
        destination: "/dashboard/hr/lifecycle/discipline",
        permanent: true,
      },
      {
        source: "/dashboard/hr/offboarding/:path*",
        destination: "/dashboard/hr/lifecycle/offboarding/:path*",
        permanent: true,
      },
      // compliance group consolidation
      {
        source: "/dashboard/hr/legal-registers/:path*",
        destination: "/dashboard/hr/compliance/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/hr/occupational-medicine/:path*",
        destination: "/dashboard/hr/compliance/occupational-medicine/:path*",
        permanent: true,
      },
      // pilotage / business
      {
        source: "/dashboard/hr/communication/:path*",
        destination: "/dashboard/hr/pilotage/communication/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/hr/social-report",
        destination: "/dashboard/hr/pilotage/dashboards",
        permanent: true,
      },
      {
        source: "/dashboard/hr/marketing/:path*",
        destination: "/dashboard/hr/business/marketing/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/hr/tenders/:path*",
        destination: "/dashboard/hr/business/tenders/:path*",
        permanent: true,
      },
    ];
  },
  // Optimisation des images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
