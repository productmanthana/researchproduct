import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Route, Switch, Redirect, useLocation, Router as WouterRouter, Link } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { Wordmark } from "@/components/brand";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import PaperPage from "@/pages/paper";
import Library from "@/pages/library";
import Projects from "@/pages/projects";
import Research from "@/pages/research";
import Landscape from "@/pages/landscape";
import Plans from "@/pages/plans";
import Sources from "@/pages/sources";
import Ask from "@/pages/ask";
import Ideas from "@/pages/ideas";
import Literature from "@/pages/literature";
import Synopsis from "@/pages/synopsis";
import Journals from "@/pages/journals";
import Thesis from "@/pages/thesis";
import Originality from "@/pages/originality";
import Patents from "@/pages/patents";
import MyLibrary from "@/pages/my-library";
import ResearchUpdates from "@/pages/research-updates";
import { ActiveProjectProvider } from "@/lib/active-project";
import { AgentProgressProvider } from "@/components/agent-progress/provider";

const queryClient = new QueryClient({ defaultOptions: { queries: {
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: (failures, error) => {
    const status = (error as { status?: number }).status;
    if (status && status < 500) return false;
    return failures < (error instanceof TypeError ? 4 : 2);
  },
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
} } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(208 68% 31%)",
    colorForeground: "hsl(216 42% 15%)",
    colorMutedForeground: "hsl(216 14% 38%)",
    colorDanger: "hsl(8 72% 47%)",
    colorBackground: "hsl(44 40% 98%)",
    colorInput: "hsl(42 33% 96%)",
    colorInputForeground: "hsl(216 42% 15%)",
    colorNeutral: "hsl(216 42% 15%)",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    borderRadius: "0.375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(44_40%_98%)] rounded-xl w-[420px] max-w-full overflow-hidden shadow-xl border border-[hsl(38_20%_84%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-['Fraunces'] text-2xl text-[hsl(216_42%_15%)]",
    headerSubtitle: "text-[hsl(216_14%_38%)]",
    socialButtonsBlockButtonText: "text-[hsl(216_42%_15%)]",
    formFieldLabel: "text-[hsl(216_42%_15%)]",
    footerActionLink: "text-[hsl(8_74%_45%)] font-medium",
    footerActionText: "text-[hsl(216_14%_38%)]",
    dividerText: "text-[hsl(216_14%_38%)]",
    identityPreviewEditButton: "text-[hsl(208_68%_31%)]",
    formFieldSuccessText: "text-[hsl(158_45%_30%)]",
    alertText: "text-[hsl(216_42%_15%)]",
    logoBox: "h-11",
    logoImage: "h-11 w-11",
    socialButtonsBlockButton: "border border-[hsl(38_20%_80%)] bg-[hsl(42_33%_96%)]",
    formButtonPrimary: "bg-[hsl(208_68%_31%)] text-[hsl(42_40%_97%)]",
    formFieldInput: "border border-[hsl(38_18%_78%)]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[hsl(38_20%_84%)]",
    alert: "border border-[hsl(8_72%_47%/0.3)] bg-[hsl(8_72%_47%/0.06)]",
    otpCodeFieldInput: "border border-[hsl(38_18%_78%)]",
    formFieldRow: "gap-2",
    main: "gap-5",
  },
};

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <div className="blueprint hidden flex-col justify-between p-12 text-[hsl(40_30%_92%)] lg:flex">
        <Link href="/" data-testid="link-auth-home"><Wordmark light /></Link>
        <div>
          <p className="font-display text-4xl leading-tight">&ldquo;Show me the page it says that on.&rdquo;</p>
          <p className="mt-4 max-w-sm text-sm text-[hsl(40_20%_78%)]">Every Evidora answer carries its quotes and sources, so your guide, your reviewer and you can check it.</p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-turmeric">Trial: 3 answers &middot; 1 review &middot; 2 figure readings</p>
      </div>
      <div className="grid-paper flex items-center justify-center bg-background px-4 py-10">{children}</div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthFrame>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthFrame>
  );
}

function SignUpPage() {
  return (
    <AuthFrame>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthFrame>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/discover" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Shelled({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <RoutedErrorBoundary>{children}</RoutedErrorBoundary>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/discover"><Shelled><Discover /></Shelled></Route>
      <Route path="/papers/:id"><Shelled><PaperPage /></Shelled></Route>
      <Route path="/library"><Shelled><Library /></Shelled></Route>
      <Route path="/projects"><Shelled><Projects /></Shelled></Route>
      <Route path="/ask"><Shelled><Ask /></Shelled></Route>
      <Route path="/research"><Shelled><Research /></Shelled></Route>
      <Route path="/landscape"><Shelled><Landscape /></Shelled></Route>
      <Route path="/plans"><Shelled><Plans /></Shelled></Route>
      <Route path="/sources"><Shelled><Sources /></Shelled></Route>
      <Route path="/ideas"><Shelled><Ideas /></Shelled></Route>
      <Route path="/literature"><Shelled><Literature /></Shelled></Route>
      <Route path="/synopsis"><Shelled><Synopsis /></Shelled></Route>
      <Route path="/journals"><Shelled><Journals /></Shelled></Route>
      <Route path="/thesis"><Shelled><Thesis /></Shelled></Route>
      <Route path="/originality"><Shelled><Originality /></Shelled></Route>
      <Route path="/patents"><Shelled><Patents /></Shelled></Route>
      <Route path="/my-library"><Shelled><MyLibrary /></Shelled></Route>
      <Route path="/research-updates"><Shelled><ResearchUpdates /></Shelled></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Back to your evidence desk", subtitle: "Sign in to Evidora" } },
        signUp: { start: { title: "Create your Evidora account", subtitle: "Starts with a free trial allowance" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <ActiveProjectProvider>
            <AgentProgressProvider>
              <Router />
              <Toaster />
            </AgentProgressProvider>
          </ActiveProjectProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
